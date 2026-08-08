import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Req,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import {
  ApiBody,
  ApiConsumes,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { ClinicSettingsService } from './clinic-settings.service';
import { ClinicSettings } from './entities/clinic-settings.entity';
import { UpdateClinicSettingsDto } from './dto/update-clinic-settings.dto';
import { Permissions } from '../../common/decorators/permissions.decorator';

@ApiTags('Clinic Settings')
@ApiBearerAuth()
@Controller({
  path: 'clinic-settings',
  version: '1',
})
@Permissions('configuracoes.clinic.view')
export class ClinicSettingsController {
  constructor(private readonly clinicSettingsService: ClinicSettingsService) {}

  @Get()
  @Permissions(
    'configuracoes.clinic.view',
    'atendimentos.appointments.view',
    'atendimentos.consultations.view',
    'atendimentos.inpatient_records.view',
    'atendimentos.prescriptions.print',
    'atendimentos.exam_requests.print',
  )
  @ApiOperation({ summary: 'Busca as configurações da clínica' })
  @ApiOkResponse({ type: ClinicSettings })
  getSettings() {
    return this.clinicSettingsService.getSettings();
  }

  @Patch()
  @Permissions('configuracoes.clinic.update')
  @ApiOperation({ summary: 'Atualiza as configurações da clínica' })
  @ApiOkResponse({ type: ClinicSettings })
  update(@Body() payload: UpdateClinicSettingsDto) {
    return this.clinicSettingsService.update(payload);
  }

  @Delete('image/:field')
  @Permissions('configuracoes.clinic.image.delete')
  @ApiOperation({ summary: 'Remove imagem da clínica' })
  @ApiOkResponse({ type: ClinicSettings })
  removeImage(@Param('field') field: string) {
    if (field !== 'logo' && field !== 'login') {
      throw new BadRequestException('Campo de imagem inválido.');
    }
    return this.clinicSettingsService.removeImage(field);
  }

  @Post('upload-image/:field')
  @Permissions('configuracoes.clinic.image.upload')
  @ApiOperation({ summary: 'Faz upload de imagem da clínica' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
        },
      },
      required: ['file'],
    },
  })
  @ApiOkResponse({ type: ClinicSettings })
  @UseInterceptors(
    FileInterceptor('file', {
      storage: memoryStorage(),
      limits: {
        fileSize: 5 * 1024 * 1024,
      },
    }),
  )
  uploadImage(
    @Param('field') field: string,
    @UploadedFile()
    file?: {
      buffer?: Buffer;
      originalname?: string;
      mimetype?: string;
      size?: number;
    },
    @Req() req?: any,
  ) {
    if (field !== 'logo' && field !== 'login') {
      throw new BadRequestException('Campo de imagem inválido.');
    }
    if (!file) {
      throw new BadRequestException('Arquivo de imagem nao enviado.');
    }

    const requestBaseUrl = `${req?.protocol || 'http'}://${req?.get?.('host') || 'localhost:3000'}`;
    return this.clinicSettingsService.uploadImage(field, file, requestBaseUrl);
  }
}
