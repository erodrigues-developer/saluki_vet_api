import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FileStorageModule } from '../file-storage/file-storage.module';
import { FiscalCertificateBinding } from './entities/fiscal-certificate-binding.entity';
import { FiscalDocumentEvent } from './entities/fiscal-document-event.entity';
import { FiscalDocumentFile } from './entities/fiscal-document-file.entity';
import { FiscalDocumentItem } from './entities/fiscal-document-item.entity';
import { FiscalDocumentSequence } from './entities/fiscal-document-sequence.entity';
import { FiscalDocument } from './entities/fiscal-document.entity';
import { FiscalIssueRequest } from './entities/fiscal-issue-request.entity';
import { FiscalNfceConfig } from './entities/fiscal-nfce-config.entity';
import { FiscalProfile } from './entities/fiscal-profile.entity';
import { FiscalController } from './fiscal.controller';
import { FiscalAdapterClient } from './fiscal-adapter.client';
import { FiscalCryptoService } from './fiscal-crypto.service';
import { FiscalIssueProcessorService } from './fiscal-issue-processor.service';
import { FiscalService } from './fiscal.service';

@Module({
  imports: [
    FileStorageModule,
    TypeOrmModule.forFeature([
      FiscalProfile,
      FiscalCertificateBinding,
      FiscalNfceConfig,
      FiscalDocumentSequence,
      FiscalDocument,
      FiscalDocumentItem,
      FiscalDocumentEvent,
      FiscalDocumentFile,
      FiscalIssueRequest,
    ]),
  ],
  controllers: [FiscalController],
  providers: [
    FiscalService,
    FiscalCryptoService,
    FiscalAdapterClient,
    FiscalIssueProcessorService,
  ],
  exports: [FiscalService, FiscalCryptoService],
})
export class FiscalModule {}
