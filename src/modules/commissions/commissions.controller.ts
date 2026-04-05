import { Controller, Get, ParseIntPipe, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CommissionsService } from './commissions.service';

@ApiTags('commissions')
@ApiBearerAuth()
@Controller('commissions')
export class CommissionsController {
  constructor(private readonly commissionsService: CommissionsService) {}

  @Get()
  @ApiOperation({
    summary: 'Listar carteira de comissoes por profissional, status e periodo',
  })
  findAll(
    @Query('page') page = '1',
    @Query('limit') limit = '10',
    @Query('status') status?: string,
    @Query('userId', new ParseIntPipe({ optional: true })) userId?: number,
    @Query('saleId', new ParseIntPipe({ optional: true })) saleId?: number,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.commissionsService.findAll({
      page: Number(page) || 1,
      limit: Number(limit) || 10,
      status,
      userId,
      saleId,
      startDate,
      endDate,
    });
  }

  @Get('summary')
  @ApiOperation({
    summary: 'Obter totais pendentes e pagos de comissoes por filtros administrativos',
  })
  getSummary(
    @Query('status') status?: string,
    @Query('userId', new ParseIntPipe({ optional: true })) userId?: number,
    @Query('saleId', new ParseIntPipe({ optional: true })) saleId?: number,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.commissionsService.getSummary({
      status,
      userId,
      saleId,
      startDate,
      endDate,
    });
  }
}
