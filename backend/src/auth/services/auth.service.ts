
import {
  Injectable,
  ConflictException,
  UnauthorizedException,
} from '@nestjs/common';

import { JwtService, JwtSignOptions } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { createHash } from 'crypto';

import { UsersService } from '../../users/services/users.services.js';
import { RefreshTokensRepository } from '../repositories/refresh-token.repository.js';
import { RegisterDto } from '../dto/register.dto.js';
import { LoginDto } from '../dto/login.dto.js';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly refreshTokensRepository: RefreshTokensRepository,
  ) {}

  private hashToken(token: string): string {
    return createHash('sha256')
      .update(token)
      .digest('hex');
  }

  // Generate access and refresh tokens
  private async generateTokens(user: {
    id: string;
    email: string;
    fullName: string;
  }) {
    const accessSecret =
      this.configService.getOrThrow<string>('JWT_ACCESS_SECRET');

    const refreshSecret =
      this.configService.getOrThrow<string>('JWT_REFRESH_SECRET');

    const accessExpiresIn =
      this.configService.get<string>('JWT_ACCESS_EXPIRES_IN') ?? '15m';

    const refreshExpiresIn =
      this.configService.get<string>('JWT_REFRESH_EXPIRES_IN') ?? '7d';

    const accessToken = await this.jwtService.signAsync(
      {
        sub: user.id,
        email: user.email,
      },
      {
        secret: accessSecret,
        expiresIn: accessExpiresIn as JwtSignOptions['expiresIn'],
      },
    );

    const refreshToken = await this.jwtService.signAsync(
      {
        sub: user.id,
        email: user.email,
      },
      {
        secret: refreshSecret,
        expiresIn: refreshExpiresIn as JwtSignOptions['expiresIn'],
      },
    );

    const decoded = this.jwtService.decode(refreshToken) as {
      exp?: number;
    } | null;

    if (!decoded?.exp) {
      throw new Error('Could not determine refresh token expiration');
    }

    await this.refreshTokensRepository.create({
      tokenHash: this.hashToken(refreshToken),
      expiresAt: new Date(decoded.exp * 1000),
      user: { id: user.id } as any,
    });

    return {
      accessToken,
      refreshToken,
    };
  }

  // Register
  async register(registerDto: RegisterDto) {
    const email = registerDto.email.trim().toLowerCase();

    const existingUser = await this.usersService.findByEmail(email);

    if (existingUser) {
      throw new ConflictException('Email is already registered');
    }

    const passwordHash = await bcrypt.hash(
      registerDto.password,
      12,
    );

    const user = await this.usersService.create({
      fullName: registerDto.fullName.trim(),
      email,
      passwordHash,
    });

    const tokens = await this.generateTokens(user);

    return {
      message: 'Registration successful',
      user: {
        id: user.id,
        fullName: user.fullName,
        email: user.email,
      },
      ...tokens,
    };
  }

  // Login
  async login(loginDto: LoginDto) {
    const email = loginDto.email.trim().toLowerCase();

    const user = await this.usersService.findByEmail(email);

    if (!user) {
      throw new UnauthorizedException('Invalid email or password');
    }

    const passwordMatches = await bcrypt.compare(
      loginDto.password,
      user.passwordHash,
    );

    if (!passwordMatches) {
      throw new UnauthorizedException('Invalid email or password');
    }

    const tokens = await this.generateTokens(user);

    return {
      message: 'Login successful',
      user: {
        id: user.id,
        fullName: user.fullName,
        email: user.email,
      },
      ...tokens,
    };
  }

  // Refresh and rotate tokens
  async refresh(rawToken: string) {
    let payload: { sub: string; email: string };

    try {
      payload = await this.jwtService.verifyAsync(
        rawToken,
        {
          secret: this.configService.getOrThrow<string>(
            'JWT_REFRESH_SECRET',
          ),
        },
      );
    } catch {
      throw new UnauthorizedException(
        'Invalid or expired refresh token',
      );
    }

    const tokenHash = this.hashToken(rawToken);

    const storedToken =
      await this.refreshTokensRepository.findByHash(tokenHash);

    if (
      !storedToken ||
      storedToken.revokedAt ||
      storedToken.expiresAt <= new Date() ||
      storedToken.user.id !== payload.sub
    ) {
      throw new UnauthorizedException(
        'Invalid or expired refresh token',
      );
    }

    // Revoke the old refresh token before issuing another
    const revoked =
      await this.refreshTokensRepository.revokeIfActive(
        storedToken.id,
      );

    if (!revoked) {
      throw new UnauthorizedException(
        'Refresh token has already been used',
      );
    }

    const tokens = await this.generateTokens(storedToken.user);

    return {
      message: 'Token refreshed successfully',
      ...tokens,
    };
  }

  // Logout
  async logout(rawToken: string) {
    const tokenHash = this.hashToken(rawToken);

    await this.refreshTokensRepository.revokeByHash(tokenHash);

    return {
      message: 'Logout successful',
    };
  }
}
