import { Body, Controller, Delete, Get, Param, ParseIntPipe, Patch, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { VeterinarianAvailabilityService } from './veterinarian-availability.service';
import { UpsertWeeklyScheduleDto } from './dto/upsert-weekly-schedule.dto';
import { Permissions } from '../../common/decorators/permissions.decorator';

@ApiTags('Veterinarian Availability')
@ApiBearerAuth()
@Controller({ path: 'veterinarian-availability', version: '1' })
export class VeterinarianAvailabilityController {
  constructor(private readonly service: VeterinarianAvailabilityService) {}

  @Get()
  @Permissions('configuracoes.availability.view', 'atendimentos.appointments.view')
  @ApiOperation({ summary: 'Busca escala e disponibilidade por veterinário' })
  getByVeterinarian(@Query('veterinarianId', ParseIntPipe) veterinarianId: number) {
    return this.service.getByVeterinarian(veterinarianId);
  }

  @Patch(':veterinarianId/weekly-schedule')
  @Permissions('configuracoes.availability.update')
  @ApiOperation({ summary: 'Atualiza escala semanal do veterinário' })
  upsertWeeklySchedule(
    @Param('veterinarianId', ParseIntPipe) veterinarianId: number,
    @Body() payload: UpsertWeeklyScheduleDto,
  ) {
    return this.service.upsertWeeklySchedule(veterinarianId, payload);
  }

  @Post(':veterinarianId/blocks')
  @Permissions('configuracoes.availability.update')
  @ApiOperation({ summary: 'Cria bloqueio pontual' })
  createBlock(@Param('veterinarianId', ParseIntPipe) veterinarianId: number, @Body() payload: any) {
    return this.service.createBlock(veterinarianId, payload);
  }

  @Patch(':veterinarianId/blocks/:id')
  @Permissions('configuracoes.availability.update')
  @ApiOperation({ summary: 'Edita bloqueio pontual' })
  updateBlock(
    @Param('veterinarianId', ParseIntPipe) veterinarianId: number,
    @Param('id', ParseIntPipe) id: number,
    @Body() payload: any,
  ) {
    return this.service.updateBlock(veterinarianId, id, payload);
  }

  @Delete(':veterinarianId/blocks/:id')
  @Permissions('configuracoes.availability.update')
  @ApiOperation({ summary: 'Remove bloqueio pontual' })
  removeBlock(@Param('veterinarianId', ParseIntPipe) veterinarianId: number, @Param('id', ParseIntPipe) id: number) {
    return this.service.removeBlock(veterinarianId, id);
  }

  @Post(':veterinarianId/absences')
  @Permissions('configuracoes.availability.update')
  @ApiOperation({ summary: 'Cria ausência/férias' })
  createAbsence(@Param('veterinarianId', ParseIntPipe) veterinarianId: number, @Body() payload: any) {
    return this.service.createAbsence(veterinarianId, payload);
  }

  @Patch(':veterinarianId/absences/:id')
  @Permissions('configuracoes.availability.update')
  @ApiOperation({ summary: 'Edita ausência/férias' })
  updateAbsence(
    @Param('veterinarianId', ParseIntPipe) veterinarianId: number,
    @Param('id', ParseIntPipe) id: number,
    @Body() payload: any,
  ) {
    return this.service.updateAbsence(veterinarianId, id, payload);
  }

  @Delete(':veterinarianId/absences/:id')
  @Permissions('configuracoes.availability.update')
  @ApiOperation({ summary: 'Remove ausência/férias' })
  removeAbsence(@Param('veterinarianId', ParseIntPipe) veterinarianId: number, @Param('id', ParseIntPipe) id: number) {
    return this.service.removeAbsence(veterinarianId, id);
  }
}
