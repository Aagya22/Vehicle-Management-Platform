
import {
    CanActivate,
    ExecutionContext,
    Injectable,
    UnauthorizedException,
  } from '@nestjs/common';
  
  import { JwtService } from '@nestjs/jwt';
  import { ConfigService } from '@nestjs/config';
  
  interface JwtPayload {
    sub: string;
    email?: string;
  }
  
  interface AuthenticatedRequest {
    headers: {
      authorization?: string;
    };
    user?: JwtPayload;
  }
  
  @Injectable()
  export class JwtAuthGuard implements CanActivate {
    constructor(
      private readonly jwtService: JwtService,
      private readonly configService: ConfigService,
    ) {}
  
    async canActivate(
      context: ExecutionContext,
    ): Promise<boolean> {
      const request = context
        .switchToHttp()
        .getRequest<AuthenticatedRequest>();
  
      const authHeader = request.headers.authorization;
  
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        throw new UnauthorizedException(
          'Access token is required',
        );
      }
  
      const token = authHeader.substring(7);
  
      try {
        const payload =
          await this.jwtService.verifyAsync<JwtPayload>(
            token,
            {
              secret: this.configService.getOrThrow<string>(
                'JWT_ACCESS_SECRET',
              ),
            },
          );
  
        if (!payload.sub) {
          throw new UnauthorizedException(
            'Invalid access token',
          );
        }
  
        request.user = payload;
  
        return true;
      } catch {
        throw new UnauthorizedException(
          'Invalid or expired access token',
        );
      }
    }
  }
  