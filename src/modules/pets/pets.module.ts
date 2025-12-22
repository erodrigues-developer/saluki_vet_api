import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PetsService } from './pets.service';
import { PetsController } from './pets.controller';
import { Pet } from './entities/pet.entity';
import { PetsRepository } from './repositories/pets.repository';
import { ClientsModule } from '../clients/clients.module';
import { SpeciesModule } from '../species/species.module';
import { BreedsModule } from '../breeds/breeds.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Pet]),
    ClientsModule,
    SpeciesModule,
    BreedsModule,
  ],
  controllers: [PetsController],
  providers: [PetsService, PetsRepository],
  exports: [PetsService],
})
export class PetsModule {}
