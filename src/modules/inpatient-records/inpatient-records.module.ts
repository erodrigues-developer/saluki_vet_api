import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { InpatientRecord } from './entities/inpatient-record.entity';
import { InpatientRecordsService } from './inpatient-records.service';
import { InpatientRecordsController } from './inpatient-records.controller';
import { Box } from '../boxes/entities/box.entity';
import { Pet } from '../pets/entities/pet.entity';
import { Consultation } from '../consultations/entities/consultation.entity';
import { ClinicalParameter } from '../clinical-parameters/entities/clinical-parameter.entity';
import { TreatmentMap } from '../treatment-map/entities/treatment-map.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      InpatientRecord,
      Box,
      Pet,
      Consultation,
      ClinicalParameter,
      TreatmentMap,
    ]),
  ],
  controllers: [InpatientRecordsController],
  providers: [InpatientRecordsService],
  exports: [InpatientRecordsService],
})
export class InpatientRecordsModule {}
