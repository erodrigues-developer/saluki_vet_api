import {
  Body,
  Controller,
  Delete,
  Get,
  Patch,
  Param,
  ParseIntPipe,
  Post,
} from '@nestjs/common';
import {
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { AppointmentStatusesService } from './appointment-statuses.service';
import { AppointmentStatus } from './entities/appointment-status.entity';
import { Permissions } from '../../common/decorators/permissions.decorator';

@ApiTags('Appointment Statuses')
@ApiBearerAuth()
@Controller({
  path: 'appointment-statuses',
  version: '1',
})
export class AppointmentStatusesController {
  constructor(
    private readonly appointmentStatusesService: AppointmentStatusesService,
  ) {}

  @Post()
  @Permissions('cadastros.appointment_statuses.create')
  @ApiOperation({ summary: 'Cria um novo status de agendamento' })
  @ApiOkResponse({ type: AppointmentStatus })
  create(@Body() payload: any) {
    return this.appointmentStatusesService.create(payload);
  }

  @Get()
  @Permissions('cadastros.appointment_statuses.view', 'atendimentos.appointments.view')
  @ApiOperation({ summary: 'Lista todos os status de agendamento' })
  @ApiOkResponse({ type: [AppointmentStatus] })
  findAll() {
    return this.appointmentStatusesService.findAll();
  }

  @Get(':id')
  @Permissions('cadastros.appointment_statuses.view', 'atendimentos.appointments.view')
  @ApiOperation({ summary: 'Busca um status por ID' })
  @ApiOkResponse({ type: AppointmentStatus })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.appointmentStatusesService.findOne(id);
  }

  @Delete(':id')
  @Permissions('cadastros.appointment_statuses.delete')
  @ApiOperation({ summary: 'Remove um status' })
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.appointmentStatusesService.remove(id);
  }

  @Patch(':id')
  @Permissions('cadastros.appointment_statuses.update')
  @ApiOperation({ summary: 'Atualiza um status de agendamento' })
  @ApiOkResponse({ type: AppointmentStatus })
  update(@Param('id', ParseIntPipe) id: number, @Body() payload: any) {
    return this.appointmentStatusesService.update(id, payload);
  }
}
