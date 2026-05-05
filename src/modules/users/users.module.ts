import { User } from './entities/user.entity';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Module } from '@nestjs/common';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { UsersRepository } from './repositories/users.repository';
import { RolesModule } from '../roles/roles.module';
import { UserRole } from './entities/user-role.entity';

@Module({
  imports: [RolesModule, TypeOrmModule.forFeature([User, UserRole])],
  controllers: [UsersController],
  providers: [UsersService, UsersRepository],
  exports: [UsersService],
})
export class UsersModule {}
