import { Module } from '@nestjs/common';
import { PetVaccinesService } from './pet-vaccines.service';

@Module({
  providers: [PetVaccinesService],
  exports: [PetVaccinesService],
})
export class PetVaccinesModule {}
