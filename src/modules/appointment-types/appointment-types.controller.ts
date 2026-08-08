import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
} from '@nestjs/common';
import {
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { AppointmentTypesService } from './appointment-types.service';
import { AppointmentType } from './entities/appointment-type.entity';
import { Permissions } from '../../common/decorators/permissions.decorator';

@ApiTags('Appointment Types')
@ApiBearerAuth()
@Controller({
  path: 'appointment-types',
  version: '1',
})
export class AppointmentTypesController {
  constructor(
    private readonly appointmentTypesService: AppointmentTypesService,
  ) {}

  @Post()
  @Permissions('cadastros.appointment_types.create')
  @ApiOperation({ summary: 'Cria um novo tipo de agendamento' })
  @ApiOkResponse({ type: AppointmentType })
  create(@Body() payload: any) {
    return this.appointmentTypesService.create(payload);
  }

  @Get()
  @Permissions('cadastros.appointment_types.view', 'atendimentos.appointments.view')
  @ApiOperation({ summary: 'Lista todos os tipos de agendamento' })
  @ApiOkResponse({ type: [AppointmentType] })
  findAll() {
    return this.appointmentTypesService.findAll();
  }

  @Get(':id')
  @Permissions('cadastros.appointment_types.view', 'atendimentos.appointments.view')
  @ApiOperation({ summary: 'Busca um tipo de agendamento por ID' })
  @ApiOkResponse({ type: AppointmentType })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.appointmentTypesService.findOne(id);
  }

  @Patch(':id')
  @Permissions('cadastros.appointment_types.update')
  @ApiOperation({ summary: 'Atualiza um tipo de agendamento' })
  @ApiOkResponse({ type: AppointmentType })
  update(@Param('id', ParseIntPipe) id: number, @Body() payload: any) {
    return this.appointmentTypesService.update(id, payload);
  }

  @Delete(':id')
  @Permissions('cadastros.appointment_types.delete')
  @ApiOperation({ summary: 'Remove um tipo de agendamento' })
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.appointmentTypesService.remove(id);
  }
}
