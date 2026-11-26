
import { Injectable } from '@nestjs/common';

import { UsersRepository } from '../repositories/user.repository.js';
import { User } from '../entities/user.entity.js';

@Injectable()
export class UsersService {
  constructor(
    private readonly usersRepository: UsersRepository,
  ) {}

  findByEmail(email: string): Promise<User | null> {
    return this.usersRepository.findByEmail(email);
  }

  findById(id: string): Promise<User | null> {
    return this.usersRepository.findById(id);
  }

  create(userData: Partial<User>): Promise<User> {
    return this.usersRepository.create(userData);
  }
}
