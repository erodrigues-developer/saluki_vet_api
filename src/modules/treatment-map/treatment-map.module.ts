import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TreatmentMap } from './entities/treatment-map.entity';
import { TreatmentMapService } from './treatment-map.service';
import { TreatmentMapController } from './treatment-map.controller';
import { TreatmentMapActionsController } from './treatment-map-actions.controller';
import { Product } from '../products/entities/product.entity';
import { Procedure } from '../procedures/entities/procedure.entity';
import { InpatientRecord } from '../inpatient-records/entities/inpatient-record.entity';
import { Box } from '../boxes/entities/box.entity';
import { Pet } from '../pets/entities/pet.entity';
import { Consultation } from '../consultations/entities/consultation.entity';
import { ClinicalParameter } from '../clinical-parameters/entities/clinical-parameter.entity';
import { InpatientRecordsModule } from '../inpatient-records/inpatient-records.module';
import { StockMovementsModule } from '../stock-movements/stock-movements.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      TreatmentMap,
      Product,
      Procedure,
      InpatientRecord,
      Box,
      Pet,
      Consultation,
      ClinicalParameter,
    ]),
    InpatientRecordsModule,
    StockMovementsModule,
  ],
  controllers: [TreatmentMapController, TreatmentMapActionsController],
  providers: [TreatmentMapService],
  exports: [TreatmentMapService],
})
export class TreatmentMapModule {}
