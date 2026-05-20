import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { VeterinarianWeeklyAvailability } from './entities/veterinarian-weekly-availability.entity';
import { VeterinarianAvailabilityBlock } from './entities/veterinarian-availability-block.entity';
import { VeterinarianAbsence } from './entities/veterinarian-absence.entity';
import { VeterinarianAvailabilityService } from './veterinarian-availability.service';
import { VeterinarianAvailabilityController } from './veterinarian-availability.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      VeterinarianWeeklyAvailability,
      VeterinarianAvailabilityBlock,
      VeterinarianAbsence,
    ]),
  ],
  controllers: [VeterinarianAvailabilityController],
  providers: [VeterinarianAvailabilityService],
  exports: [VeterinarianAvailabilityService],
})
export class VeterinarianAvailabilityModule {}
