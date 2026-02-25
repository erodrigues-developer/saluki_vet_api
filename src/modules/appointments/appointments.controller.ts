import { Body, Controller, Delete, Get, Param, ParseIntPipe, Patch, Post, Query } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { AppointmentsService } from './appointments.service';
import { Appointment } from './entities/appointment.entity';

@ApiTags('Appointments')
@Controller({
  path: 'appointments',
  version: '1',
})
export class AppointmentsController {
  constructor(private readonly appointmentsService: AppointmentsService) {}

  @Post()
  @ApiOperation({ summary: 'Cria um novo agendamento' })
  @ApiOkResponse({ type: Appointment })
  create(@Body() payload: any) {
    return this.appointmentsService.create(payload);
  }

  @Get()
  @ApiOperation({ summary: 'Lista agendamentos com paginação e filtros' })
  findAll(@Query() query: any) {
    return this.appointmentsService.findAll(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Busca um agendamento por ID' })
  @ApiOkResponse({ type: Appointment })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.appointmentsService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Atualiza um agendamento' })
  @ApiOkResponse({ type: Appointment })
  update(@Param('id', ParseIntPipe) id: number, @Body() payload: any) {
    return this.appointmentsService.update(id, payload);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Remove um agendamento' })
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.appointmentsService.remove(id);
  }
}
