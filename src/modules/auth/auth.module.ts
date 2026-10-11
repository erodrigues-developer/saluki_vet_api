import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { UsersModule } from '../users/users.module';
import { SessionModule } from '../../security/session.module';
@Module({ imports: [UsersModule, SessionModule], controllers: [AuthController], providers: [AuthService], exports: [AuthService] })
export class AuthModule {}
