import { ConsultationProcedure } from './entities/consultation-procedure.entity';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Module } from '@nestjs/common';
import { ConsultationProceduresService } from './consultation-procedures.service';
import { ConsultationProceduresController } from './consultation-procedures.controller';
import { ConsultationProceduresRepository } from './repositories/consultation-procedures.repository';

@Module({
  imports: [TypeOrmModule.forFeature([ConsultationProcedure])],
  controllers: [ConsultationProceduresController],
  providers: [ConsultationProceduresService, ConsultationProceduresRepository],
  exports: [ConsultationProceduresService],
})
export class ConsultationProceduresModule {}
