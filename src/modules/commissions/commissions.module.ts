import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Commission } from './entities/commission.entity';
import { CommissionsController } from './commissions.controller';
import { CommissionsService } from './commissions.service';
import { CommissionsRepository } from './repositories/commissions.repository';

@Module({
  imports: [TypeOrmModule.forFeature([Commission])],
  controllers: [CommissionsController],
  providers: [CommissionsService, CommissionsRepository],
  exports: [CommissionsService, CommissionsRepository],
})
export class CommissionsModule {}
