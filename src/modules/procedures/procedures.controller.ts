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
} from '@nestjs/common';
import {
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { ProceduresService } from './procedures.service';
import { Procedure } from './entities/procedure.entity';
import { CreateProcedureDto } from './dto/create-procedure.dto';
import { UpdateProcedureDto } from './dto/update-procedure.dto';

@ApiTags('Procedures')
@ApiBearerAuth()
@Controller({
  path: 'procedures',
  version: '1',
})
export class ProceduresController {
  constructor(private readonly proceduresService: ProceduresService) {}

  @Post()
  @ApiOperation({ summary: 'Cria um novo procedimento clínico' })
  @ApiOkResponse({ type: Procedure })
  create(@Body() payload: CreateProcedureDto) {
    return this.proceduresService.create(payload);
  }

  @Get()
  @ApiOperation({ summary: 'Lista procedimentos com paginação e filtros' })
  findAll(@Query() query: any) {
    return this.proceduresService.findAll(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Busca um procedimento por ID' })
  @ApiOkResponse({ type: Procedure })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.proceduresService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Atualiza um procedimento' })
  @ApiOkResponse({ type: Procedure })
  update(@Param('id', ParseIntPipe) id: number, @Body() payload: UpdateProcedureDto) {
    return this.proceduresService.update(id, payload);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Remove um procedimento' })
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.proceduresService.remove(id);
  }
}
