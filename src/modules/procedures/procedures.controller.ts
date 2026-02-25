import { Body, Controller, Delete, Get, Param, ParseIntPipe, Patch, Post, Query } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { ProceduresService } from './procedures.service';
import { Procedure } from './entities/procedure.entity';

@ApiTags('Procedures')
@Controller({
  path: 'procedures',
  version: '1',
})
export class ProceduresController {
  constructor(private readonly proceduresService: ProceduresService) {}

  @Post()
  @ApiOperation({ summary: 'Cria um novo procedimento clínico' })
  @ApiOkResponse({ type: Procedure })
  create(@Body() payload: any) {
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
  update(@Param('id', ParseIntPipe) id: number, @Body() payload: any) {
    return this.proceduresService.update(id, payload);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Remove um procedimento' })
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.proceduresService.remove(id);
  }
}
