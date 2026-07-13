import {
  BadRequestException,
  Controller,
  Get,
  Param,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { ReportsService } from './reports.service';
import { GenerateReportDto } from './dto/generate-report.dto';
import { ListReportHistoryDto } from './dto/list-report-history.dto';

@ApiTags('Reports')
@ApiBearerAuth('jwt')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN')
@Controller('reports')
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Get('catalog')
  @ApiOperation({ summary: 'Listar catálogo de relatórios disponíveis' })
  getCatalog() {
    return this.reportsService.getCatalog();
  }

  @Post(':type/generate')
  @ApiOperation({ summary: 'Gerar relatório em XLSX e salvar histórico' })
  generate(
    @Param('type') type: string,
    @Query() filters: GenerateReportDto,
    @Req() req: any,
  ) {
    const userId = Number(req.user?.userId);
    const requestBaseUrl = this.resolveRequestBaseUrl(req);

    return this.reportsService.generateReport({
      reportType: type,
      filters,
      requestedByUserId: userId,
      requestBaseUrl,
    });
  }

  @Get('history')
  @ApiOperation({ summary: 'Listar histórico de relatórios gerados' })
  listHistory(@Query() query: ListReportHistoryDto, @Req() req: any) {
    const userId = Number(req.user?.userId);
    return this.reportsService.listHistory(query, userId);
  }

  @Get('history/:id')
  @ApiOperation({ summary: 'Obter detalhes de um relatório gerado' })
  getHistoryItem(@Param('id') id: string, @Req() req: any) {
    return this.reportsService.findHistoryItem(
      this.parseId(id),
      Number(req.user?.userId),
    );
  }

  @Get('history/:id/download')
  @ApiOperation({ summary: 'Obter URL de download de um relatório gerado' })
  getDownload(@Param('id') id: string, @Req() req: any) {
    return this.reportsService.getDownloadInfo(
      this.parseId(id),
      Number(req.user?.userId),
    );
  }

  private parseId(value: string): number {
    const id = Number.parseInt(value, 10);
    if (Number.isNaN(id)) {
      throw new BadRequestException('id must be numeric');
    }
    return id;
  }

  private resolveRequestBaseUrl(req: any) {
    const protocol = req.protocol || 'http';
    const host = req.get?.('host') || req.headers?.host || 'localhost:3000';
    return `${protocol}://${host}`;
  }
}
