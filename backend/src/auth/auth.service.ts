
import {
  Injectable,
  ConflictException,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { JwtService, JwtSignOptions } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import {
  Repository,
  IsNull,
} from 'typeorm';
import * as bcrypt from 'bcrypt';
import { createHash } from 'crypto';

import { UsersService } from '../users/users.services.js';
import { RefreshToken } from './entities/refresh-token.entity.js';
import { RegisterDto } from './dto/register.dto.js';
import { LoginDto } from './dto/login.dto.js';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,

    @InjectRepository(RefreshToken)
    private readonly refreshTokenRepository: Repository<RefreshToken>,
  ) {}

  // Hash refresh tokens 
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

    //refresh token expiration timestamp
    const decoded = this.jwtService.decode(refreshToken) as {
      exp?: number;
    } | null;

    if (!decoded?.exp) {
      throw new Error('Could not determine refresh token expiration');
    }

    const tokenRecord = this.refreshTokenRepository.create({
      tokenHash: this.hashToken(refreshToken),
      expiresAt: new Date(decoded.exp * 1000),
      user: { id: user.id } as any,
    });

    await this.refreshTokenRepository.save(tokenRecord);

    return {
      accessToken,
      refreshToken,
    };
  }

  // Register a new user
  async register(registerDto: RegisterDto) {
    const existingUser = await this.usersService.findByEmail(
      registerDto.email,
    );

    if (existingUser) {
      throw new ConflictException('Email is already registered');
    }

    // Hash password before saving
    const passwordHash = await bcrypt.hash(
      registerDto.password,
      12,
    );

    const user = await this.usersService.create({
      fullName: registerDto.fullName,
      email: registerDto.email,
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

  // Login an existing user
  async login(loginDto: LoginDto) {
    const user = await this.usersService.findByEmail(
      loginDto.email,
    );

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

  async refresh(rawToken: string) {
    let payload: { sub: string };

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

    const storedToken = await this.refreshTokenRepository.findOne({
      where: { tokenHash },
      relations: { user: true },
    });

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

    // Revoke the old token atomically 
    const revokeResult = await this.refreshTokenRepository.update(
      {
        id: storedToken.id,
        revokedAt: IsNull(),
      },
      {
        revokedAt: new Date(),
      },
    );

    if (revokeResult.affected !== 1) {
      throw new UnauthorizedException(
        'Refresh token has already been used',
      );
    }

    // new access token and refresh token
    const tokens = await this.generateTokens(storedToken.user);

    return {
      message: 'Token refreshed successfully',
      ...tokens,
    };
  }

  // Logout by revoking the refresh token
  async logout(rawToken: string) {
    const tokenHash = this.hashToken(rawToken);

    const storedToken = await this.refreshTokenRepository.findOne({
      where: { tokenHash },
    });

    if (storedToken && !storedToken.revokedAt) {
      storedToken.revokedAt = new Date();

      await this.refreshTokenRepository.save(storedToken);
    }

    return {
      message: 'Logout successful',
    };
  }
}
