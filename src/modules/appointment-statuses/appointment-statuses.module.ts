import { AppointmentStatus } from './entities/appointment-status.entity';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Module } from '@nestjs/common';
import { AppointmentStatusesService } from './appointment-statuses.service';
import { AppointmentStatusesController } from './appointment-statuses.controller';
import { AppointmentStatusesRepository } from './repositories/appointment-statuses.repository';

@Module({
  imports: [TypeOrmModule.forFeature([AppointmentStatus])],
  controllers: [AppointmentStatusesController],
  providers: [AppointmentStatusesService, AppointmentStatusesRepository],
  exports: [AppointmentStatusesService],
})
export class AppointmentStatusesModule {}
