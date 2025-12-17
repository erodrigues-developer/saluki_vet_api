import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BreedsService } from './breeds.service';
import { BreedsController } from './breeds.controller';
import { Breed } from './entities/breed.entity';
import { BreedsRepository } from './repositories/breeds.repository';
import { SpeciesModule } from '../species/species.module';

@Module({
  imports: [TypeOrmModule.forFeature([Breed]), SpeciesModule],
  controllers: [BreedsController],
  providers: [BreedsService, BreedsRepository],
  exports: [BreedsService],
})
export class BreedsModule {}
