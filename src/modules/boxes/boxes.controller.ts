import { Controller, Get, Query } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { BoxesService } from './boxes.service';
import { FilterBoxesDto } from './dto/filter-boxes.dto';
import { Box } from './entities/box.entity';

@ApiTags('Boxes')
@ApiBearerAuth()
@Controller({
  path: 'boxes',
  version: '1',
})
export class BoxesController {
  constructor(private readonly boxesService: BoxesService) {}

  @Get()
  @ApiOperation({ summary: 'Lista boxes com status de ocupacao' })
  @ApiOkResponse({ type: Box, isArray: true })
  findAll(@Query() query: FilterBoxesDto) {
    return this.boxesService.findAll(query);
  }
}
