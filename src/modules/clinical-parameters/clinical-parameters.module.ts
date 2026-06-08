import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ClinicalParameter } from './entities/clinical-parameter.entity';
import { ClinicalParametersController } from './clinical-parameters.controller';
import { ClinicalParametersService } from './clinical-parameters.service';
import { InpatientRecord } from '../inpatient-records/entities/inpatient-record.entity';
import { Box } from '../boxes/entities/box.entity';
import { Pet } from '../pets/entities/pet.entity';
import { Consultation } from '../consultations/entities/consultation.entity';
import { TreatmentMap } from '../treatment-map/entities/treatment-map.entity';
import { InpatientRecordsModule } from '../inpatient-records/inpatient-records.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      ClinicalParameter,
      InpatientRecord,
      Box,
      Pet,
      Consultation,
      TreatmentMap,
    ]),
    InpatientRecordsModule,
  ],
  controllers: [ClinicalParametersController],
  providers: [ClinicalParametersService],
  exports: [ClinicalParametersService],
})
export class ClinicalParametersModule {}
