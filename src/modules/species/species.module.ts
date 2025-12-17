import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SpeciesService } from './species.service';
import { SpeciesController } from './species.controller';
import { Species } from './entities/species.entity';
import { SpeciesRepository } from './repositories/species.repository';

@Module({
  imports: [TypeOrmModule.forFeature([Species])],
  controllers: [SpeciesController],
  providers: [SpeciesService, SpeciesRepository],
  exports: [SpeciesService],
})
export class SpeciesModule {}
