
import {
    Controller,
    Post,
    Patch,
    Delete,
    Body,
    UseGuards,
    Req,
    HttpCode,
    HttpStatus,
  } from '@nestjs/common';
  
  import type { Request } from 'express';
  
  import { AuthService } from './auth.service.js';
  import { JwtAuthGuard } from './guards/jwt-auth.guard.js';
  
  import { ForgotPasswordDto } from './dto/forgot-password.dto.js';
  import { ResetPasswordDto } from './dto/reset-password.dto.js';
  import { ChangePasswordDto } from './dto/change-password.dto.js';
  import { DeleteAccountDto } from './dto/delete-account.dto.js';
  
  interface AuthenticatedRequest extends Request {
    user: {
      sub: string;
      email?: string;
    };
  }
  
  @Controller('auth')
  export class AuthController {
    constructor(
      private readonly authService: AuthService,
    ) {}
  
    // ==========================================
    // 1. FORGOT PASSWORD
    // POST /auth/forgot-password
    // ==========================================
  
    @Post('forgot-password')
    @HttpCode(HttpStatus.OK)
    async forgotPassword(
      @Body() dto: ForgotPasswordDto,
    ) {
      return this.authService.forgotPassword(dto);
    }
  
    // ==========================================
    // 2. RESET PASSWORD
    // POST /auth/reset-password
    // ==========================================
  
    @Post('reset-password')
    @HttpCode(HttpStatus.OK)
    async resetPassword(
      @Body() dto: ResetPasswordDto,
    ) {
      return this.authService.resetPassword(dto);
    }
  
    // ==========================================
    // 3. CHANGE PASSWORD
    // PATCH /auth/change-password
    // ==========================================
  
    @Patch('change-password')
    @UseGuards(JwtAuthGuard)
    async changePassword(
      @Req() req: AuthenticatedRequest,
      @Body() dto: ChangePasswordDto,
    ) {
      const userId = req.user.sub;
  
      return this.authService.changePassword(
        userId,
        dto,
      );
    }
  
    // ==========================================
    // 4. DELETE ACCOUNT
    // DELETE /auth/account
    // ==========================================
  
    @Delete('account')
    @UseGuards(JwtAuthGuard)
    async deleteAccount(
      @Req() req: AuthenticatedRequest,
      @Body() dto: DeleteAccountDto,
    ) {
      const userId = req.user.sub;
  
      return this.authService.deleteAccount(
        userId,
        dto,
      );
    }
  }
  