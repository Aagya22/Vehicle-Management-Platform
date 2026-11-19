
import {
    Injectable,
    BadRequestException,
    NotFoundException,
    UnauthorizedException,
    ServiceUnavailableException,
  } from '@nestjs/common';
  
  import { InjectRepository } from '@nestjs/typeorm';
  import { Repository, IsNull } from 'typeorm';
  
  import { ConfigService } from '@nestjs/config';
  
  import * as bcrypt from 'bcrypt';
  import { randomBytes, createHash } from 'crypto';
  import nodemailer from 'nodemailer';
  
  import { UsersService } from '../users/users.services.js';
  import { RefreshToken } from './entities/refresh-token.entity.js';
  
  import { ForgotPasswordDto } from './dto/forgot-password.dto.js';
  import { ResetPasswordDto } from './dto/reset-password.dto.js';
  import { ChangePasswordDto } from './dto/change-password.dto.js';
  import { DeleteAccountDto } from './dto/delete-account.dto.js';
  
  @Injectable()
  export class AuthService {
    private readonly mailTransporter: ReturnType<typeof nodemailer.createTransport>;
      
    constructor(
      private readonly usersService: UsersService,
  
      @InjectRepository(RefreshToken)
      private readonly refreshTokenRepository: Repository<RefreshToken>,
  
      private readonly configService: ConfigService,
    ) {
      this.mailTransporter = nodemailer.createTransport({
        host: this.configService.getOrThrow<string>('SMTP_HOST'),
  
        port: Number(
          this.configService.get<string>('SMTP_PORT') ?? 587,
        ),
  
        secure:
          Number(this.configService.get<string>('SMTP_PORT')) === 465,
  
        auth: {
          user: this.configService.getOrThrow<string>('SMTP_USER'),
          pass: this.configService.getOrThrow<string>('SMTP_PASS'),
        },
      });
    }
  
    // ==========================================
    // 1. FORGOT PASSWORD
    // ==========================================
  
    async forgotPassword(dto: ForgotPasswordDto) {
      const user = await this.usersService.findByEmail(dto.email);
  
      const message =
        'If an account with that email exists, a password reset link has been sent.';
  
      // Return the same response whether the email exists or not.
      if (!user) {
        return { message };
      }
  
      // Generate a secure random token.
      const resetToken = randomBytes(32).toString('hex');
  
      // Hash the token before saving it to the database.
      const hashedToken = createHash('sha256')
        .update(resetToken)
        .digest('hex');
  
      // Token expires after 15 minutes.
      const expirationTime = new Date(
        Date.now() + 15 * 60 * 1000,
      );
  
      // Save the hashed token and expiration time.
      await this.usersService.update(user, {
        resetPasswordToken: hashedToken,
        resetPasswordExpires: expirationTime,
      });
  
      // Create the frontend reset URL.
      const frontendUrl = new URL(
        this.configService.getOrThrow<string>(
          'FRONTEND_RESET_PASSWORD_URL',
        ),
      );
  
      frontendUrl.searchParams.set('token', resetToken);
  
      try {
        await this.mailTransporter.sendMail({
          from: this.configService.getOrThrow<string>('SMTP_FROM'),
  
          to: user.email,
  
          subject: 'Password Reset Request',
  
          html: `
            <h2>Password Reset Request</h2>
  
            <p>Hello ${user.fullName},</p>
  
            <p>We received a request to reset your password.</p>
  
            <p>Click the link below to create a new password:</p>
  
            <a href="${frontendUrl.toString()}">
              Reset My Password
            </a>
  
            <p>This link will expire in 15 minutes.</p>
  
            <p>If you did not request this, please ignore this email.</p>
          `,
        });
      } catch {
        throw new ServiceUnavailableException(
          'Unable to send the password reset email. Please try again later.',
        );
      }
  
      return { message };
    }
  
    // ==========================================
    // 2. RESET PASSWORD
    // ==========================================
  
    async resetPassword(dto: ResetPasswordDto) {
      // Hash the token received from the frontend.
      const hashedToken = createHash('sha256')
        .update(dto.token)
        .digest('hex');
  
      // Find the user using the hashed token.
      const user =
        await this.usersService.findByResetPasswordToken(
          hashedToken,
        );
  
      if (!user || !user.resetPasswordExpires) {
        throw new BadRequestException(
          'Invalid or expired password reset token.',
        );
      }
  
      // Check whether the token has expired.
      if (user.resetPasswordExpires <= new Date()) {
        throw new BadRequestException(
          'Invalid or expired password reset token.',
        );
      }
  
      // Hash the new password.
      const hashedPassword = await bcrypt.hash(
        dto.newPassword,
        12,
      );
  
      // Update password and clear the reset token.
      await this.usersService.update(user, {
        passwordHash: hashedPassword,
        resetPasswordToken: null,
        resetPasswordExpires: null,
      });
  
      // Revoke all existing refresh tokens.
      await this.revokeRefreshTokens(user.id);
  
      return {
        message: 'Password has been reset successfully.',
      };
    }
  
    // ==========================================
    // 3. CHANGE PASSWORD
    // ==========================================
  
    async changePassword(
      userId: string,
      dto: ChangePasswordDto,
    ) {
      // Find the logged-in user.
      const user = await this.usersService.findById(userId);
  
      if (!user) {
        throw new NotFoundException('User not found.');
      }
  
      // Verify the current password.
      const isPasswordValid = await bcrypt.compare(
        dto.currentPassword,
        user.passwordHash,
      );
  
      if (!isPasswordValid) {
        throw new UnauthorizedException(
          'Current password is incorrect.',
        );
      }
  
      // Prevent using the same password again.
      const isSamePassword = await bcrypt.compare(
        dto.newPassword,
        user.passwordHash,
      );
  
      if (isSamePassword) {
        throw new BadRequestException(
          'New password must be different from the current password.',
        );
      }
  
      // Hash the new password.
      const hashedPassword = await bcrypt.hash(
        dto.newPassword,
        12,
      );
  
      // Save the new password.
      await this.usersService.update(user, {
        passwordHash: hashedPassword,
      });
  
      // Revoke existing refresh tokens.
      await this.revokeRefreshTokens(userId);
  
      return {
        message: 'Password changed successfully.',
      };
    }
  
    // ==========================================
    // 4. DELETE ACCOUNT
    // ==========================================
  
    async deleteAccount(
      userId: string,
      dto: DeleteAccountDto,
    ) {
      // Find the logged-in user.
      const user = await this.usersService.findById(userId);
  
      if (!user) {
        throw new NotFoundException('User not found.');
      }
  
      // Verify the current password.
      const isPasswordValid = await bcrypt.compare(
        dto.currentPassword,
        user.passwordHash,
      );
  
      if (!isPasswordValid) {
        throw new UnauthorizedException(
          'Current password is incorrect.',
        );
      }
  
      // Delete the account.
      // Related refresh tokens are deleted through CASCADE.
      await this.usersService.deleteById(userId);
  
      return {
        message: 'Account deleted successfully.',
      };
    }
  
    // ==========================================
    // HELPER: REVOKE REFRESH TOKENS
    // ==========================================
  
    private async revokeRefreshTokens(
      userId: string,
    ): Promise<void> {
      await this.refreshTokenRepository.update(
        {
          user: { id: userId },
          revokedAt: IsNull(),
        },
        {
          revokedAt: new Date(),
        },
      );
    }
  }
  
