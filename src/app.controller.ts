import { Controller, Get, VERSION_NEUTRAL } from '@nestjs/common';
import { AppService, HealthResponse } from './app.service';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';

@ApiTags('Health')
@Controller({
  path: '',
  version: VERSION_NEUTRAL,
})
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  @ApiOperation({ summary: 'Health check da aplicação' })
  @ApiOkResponse({
    description: 'Status do serviço e dependências (DB, Redis, memória)',
  })
  getHealth(): Promise<HealthResponse> {
    return this.appService.getHealth();
  }
}
