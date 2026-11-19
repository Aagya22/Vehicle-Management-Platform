
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import {
  Repository,
  IsNull,
} from 'typeorm';

import { RefreshToken } from '../entities/refresh-token.entity.js';

@Injectable()
export class RefreshTokensRepository {
  constructor(
    @InjectRepository(RefreshToken)
    private readonly repository: Repository<RefreshToken>,
  ) {}

  async create(tokenData: Partial<RefreshToken>): Promise<RefreshToken> {
    const token = this.repository.create(tokenData);

    return this.repository.save(token);
  }

  async findByHash(tokenHash: string): Promise<RefreshToken | null> {
    return this.repository.findOne({
      where: { tokenHash },
      relations: { user: true },
    });
  }

  async revokeIfActive(id: string): Promise<boolean> {
    const result = await this.repository.update(
      {
        id,
        revokedAt: IsNull(),
      },
      {
        revokedAt: new Date(),
      },
    );

    return result.affected === 1;
  }

  async revokeByHash(tokenHash: string): Promise<void> {
    await this.repository.update(
      {
        tokenHash,
        revokedAt: IsNull(),
      },
      {
        revokedAt: new Date(),
      },
    );
  }
}
