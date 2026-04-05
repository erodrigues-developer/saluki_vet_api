import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Box } from './entities/box.entity';
import { BoxesService } from './boxes.service';
import { BoxesController } from './boxes.controller';
import { InpatientRecord } from '../inpatient-records/entities/inpatient-record.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Box, InpatientRecord])],
  controllers: [BoxesController],
  providers: [BoxesService],
  exports: [BoxesService],
})
export class BoxesModule {}
