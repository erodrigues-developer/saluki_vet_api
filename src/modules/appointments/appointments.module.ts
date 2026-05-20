import { Appointment } from './entities/appointment.entity';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Module } from '@nestjs/common';
import { AppointmentsService } from './appointments.service';
import { AppointmentsController } from './appointments.controller';
import { AppointmentsRepository } from './repositories/appointments.repository';
import { ClinicSettingsModule } from '../clinic-settings/clinic-settings.module';
import { VeterinarianAvailabilityModule } from '../veterinarian-availability/veterinarian-availability.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Appointment]),
    ClinicSettingsModule,
    VeterinarianAvailabilityModule,
  ],
  controllers: [AppointmentsController],
  providers: [AppointmentsService, AppointmentsRepository],
  exports: [AppointmentsService],
})
export class AppointmentsModule {}
