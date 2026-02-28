import { AppointmentType } from './entities/appointment-type.entity';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Module } from '@nestjs/common';
import { AppointmentTypesService } from './appointment-types.service';
import { AppointmentTypesController } from './appointment-types.controller';
import { AppointmentTypesRepository } from './repositories/appointment-types.repository';

@Module({
  imports: [TypeOrmModule.forFeature([AppointmentType])],
  controllers: [AppointmentTypesController],
  providers: [AppointmentTypesService, AppointmentTypesRepository],
  exports: [AppointmentTypesService],
})
export class AppointmentTypesModule {}
