import { Global, Module } from '@nestjs/common';
import { RedisModule } from '../modules/redis/redis.module';
import { UsersModule } from '../modules/users/users.module';
import { SessionService } from './session.service';
@Global()
@Module({ imports: [RedisModule, UsersModule], providers: [SessionService], exports: [SessionService] })
export class SessionModule {}
