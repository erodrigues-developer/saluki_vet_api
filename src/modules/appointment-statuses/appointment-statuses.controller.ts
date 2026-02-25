import { Body, Controller, Delete, Get, Param, ParseIntPipe, Post } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { AppointmentStatusesService } from './appointment-statuses.service';
import { AppointmentStatus } from './entities/appointment-status.entity';

@ApiTags('Appointment Statuses')
@Controller({
  path: 'appointment-statuses',
  version: '1',
})
export class AppointmentStatusesController {
  constructor(private readonly appointmentStatusesService: AppointmentStatusesService) {}

  @Post()
  @ApiOperation({ summary: 'Cria um novo status de agendamento' })
  @ApiOkResponse({ type: AppointmentStatus })
  create(@Body() payload: any) {
    return this.appointmentStatusesService.create(payload);
  }

  @Get()
  @ApiOperation({ summary: 'Lista todos os status de agendamento' })
  @ApiOkResponse({ type: [AppointmentStatus] })
  findAll() {
    return this.appointmentStatusesService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Busca um status por ID' })
  @ApiOkResponse({ type: AppointmentStatus })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.appointmentStatusesService.findOne(id);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Remove um status' })
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.appointmentStatusesService.remove(id);
  }
}
