
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';

import { AuthService } from '../services/auth.service.js';
import { AuthController } from '../controller/auth.controller.js';
import { RefreshToken } from '../entities/refresh-token.entity.js';
import { UsersModule } from '../../users/module/users.module.js';
import { JwtAuthGuard } from '../guards/jwt-auth.guard.js';
import { RefreshTokensRepository } from '../repositories/refresh-token.repository.js';


@Module({
  imports: [
    UsersModule,
    TypeOrmModule.forFeature([RefreshToken]),
    JwtModule.register({}),
  ],
  controllers: [AuthController],
  providers: [
    AuthService,
    RefreshTokensRepository,
    JwtAuthGuard,
  ],
  exports: [AuthService, JwtAuthGuard],
})
export class AuthModule {}