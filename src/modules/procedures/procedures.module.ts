import { Procedure } from './entities/procedure.entity';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Module } from '@nestjs/common';
import { ProceduresService } from './procedures.service';
import { ProceduresController } from './procedures.controller';
import { ProceduresRepository } from './repositories/procedures.repository';

@Module({
  imports: [TypeOrmModule.forFeature([Procedure])],
  controllers: [ProceduresController],
  providers: [ProceduresService, ProceduresRepository],
  exports: [ProceduresService],
})
export class ProceduresModule {}
