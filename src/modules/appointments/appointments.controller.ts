import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  Req,
} from '@nestjs/common';
import {
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { AppointmentsService } from './appointments.service';
import { Appointment } from './entities/appointment.entity';
import { Permissions } from '../../common/decorators/permissions.decorator';

@ApiTags('Appointments')
@ApiBearerAuth()
@Controller({
  path: 'appointments',
  version: '1',
})
@Permissions('atendimentos.appointments.view')
export class AppointmentsController {
  constructor(private readonly appointmentsService: AppointmentsService) {}

  @Post()
  @Permissions('atendimentos.appointments.create')
  @ApiOperation({ summary: 'Cria um novo agendamento' })
  @ApiOkResponse({ type: Appointment })
  create(@Body() payload: any) {
    return this.appointmentsService.create(payload);
  }

  @Post('quick-create')
  @Permissions('atendimentos.appointments.quick_create')
  @ApiOperation({ summary: 'Cria tutor, pet e agendamento em uma transação' })
  @ApiOkResponse({ type: Appointment })
  quickCreate(@Body() payload: any) {
    return this.appointmentsService.quickCreate(payload);
  }

  @Post(':id/check-in')
  @Permissions('atendimentos.appointments.checkin')
  @ApiOperation({ summary: 'Registra chegada e classifica triagem' })
  @ApiOkResponse({ type: Appointment })
  checkIn(
    @Param('id', ParseIntPipe) id: number,
    @Body() payload: any,
    @Req() req: any,
  ) {
    return this.appointmentsService.checkIn(id, payload, req.user?.userId);
  }

  @Post(':id/confirm')
  @Permissions('atendimentos.appointments.confirm')
  @ApiOperation({ summary: 'Confirma agendamento (SCHEDULED -> CONFIRMED)' })
  @ApiOkResponse({ type: Appointment })
  confirm(@Param('id', ParseIntPipe) id: number) {
    return this.appointmentsService.confirm(id);
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
  @Permissions('atendimentos.appointments.update')
  @ApiOperation({ summary: 'Atualiza um agendamento' })
  @ApiOkResponse({ type: Appointment })
  update(@Param('id', ParseIntPipe) id: number, @Body() payload: any) {
    return this.appointmentsService.update(id, payload);
  }

  @Delete(':id')
  @Permissions('atendimentos.appointments.cancel')
  @ApiOperation({ summary: 'Remove um agendamento' })
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.appointmentsService.remove(id);
  }
}
