import { BadRequestException, Controller, Get, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CommissionsService } from './commissions.service';

@ApiTags('commissions')
@ApiBearerAuth()
@Controller('commissions')
export class CommissionsController {
  constructor(private readonly commissionsService: CommissionsService) {}

  private parseOptionalInt(value?: string): number | undefined {
    if (value === undefined || value === null || value === '') return undefined;
    const parsed = Number(value);
    if (!Number.isInteger(parsed)) {
      throw new BadRequestException(
        'Validation failed (numeric string is expected)',
      );
    }
    return parsed;
  }

  @Get()
  @ApiOperation({
    summary: 'Listar carteira de comissoes por profissional, status e periodo',
  })
  findAll(
    @Query('page') page = '1',
    @Query('limit') limit = '10',
    @Query('status') status?: string,
    @Query('userId') userId?: string,
    @Query('saleId') saleId?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.commissionsService.findAll({
      page: Number(page) || 1,
      limit: Number(limit) || 10,
      status,
      userId: this.parseOptionalInt(userId),
      saleId: this.parseOptionalInt(saleId),
      startDate,
      endDate,
    });
  }

  @Get('summary')
  @ApiOperation({
    summary:
      'Obter totais pendentes e pagos de comissoes por filtros administrativos',
  })
  getSummary(
    @Query('status') status?: string,
    @Query('userId') userId?: string,
    @Query('saleId') saleId?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.commissionsService.getSummary({
      status,
      userId: this.parseOptionalInt(userId),
      saleId: this.parseOptionalInt(saleId),
      startDate,
      endDate,
    });
  }
}
