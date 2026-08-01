import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Cron, CronExpression } from '@nestjs/schedule';
import { createHash } from 'crypto';
import { Brackets, DataSource, EntityManager } from 'typeorm';
import { Client } from '../clients/entities/client.entity';
import { FileStorageService } from '../file-storage/file-storage.service';
import { Payment } from '../payments/entities/payment.entity';
import { Sale } from '../sales/entities/sale.entity';
import { FiscalAdapterClient, FiscalAdapterIssueResponse } from './fiscal-adapter.client';
import { FiscalCryptoService } from './fiscal-crypto.service';
import { FiscalCertificateBinding } from './entities/fiscal-certificate-binding.entity';
import { FiscalDocumentEvent } from './entities/fiscal-document-event.entity';
import { FiscalDocumentFile } from './entities/fiscal-document-file.entity';
import { FiscalDocumentItem } from './entities/fiscal-document-item.entity';
import { FiscalDocument } from './entities/fiscal-document.entity';
import { FiscalIssueRequest } from './entities/fiscal-issue-request.entity';
import { FiscalNfceConfig } from './entities/fiscal-nfce-config.entity';
import { FiscalProfile } from './entities/fiscal-profile.entity';

@Injectable()
export class FiscalIssueProcessorService {
  private readonly logger = new Logger(FiscalIssueProcessorService.name);

  constructor(
    private readonly dataSource: DataSource,
    private readonly configService: ConfigService,
    private readonly fiscalCryptoService: FiscalCryptoService,
    private readonly fiscalAdapterClient: FiscalAdapterClient,
    private readonly fileStorageService: FileStorageService,
  ) {}

  @Cron(CronExpression.EVERY_30_SECONDS)
  async processPendingFromCron() {
    if (this.configService.get<string>('FISCAL_ISSUE_WORKER_ENABLED') === 'false') {
      return;
    }
    try {
      await this.processPending(5);
    } catch (error) {
      this.logger.error(
        error instanceof Error ? error.message : 'Erro ao processar fila fiscal.',
      );
    }
  }

  async processPending(limit = 10) {
    const requests = await this.dataSource
      .getRepository(FiscalIssueRequest)
      .createQueryBuilder('request')
      .where('request.requestType = :requestType', { requestType: 'ISSUE' })
      .andWhere('request.documentType = :documentType', { documentType: 'NFCE' })
      .andWhere(
        new Brackets((qb) => {
          qb.where('request.status = :pending', { pending: 'PENDING_ISSUE' })
            .orWhere(
              'request.status = :failed AND request.nextRetryAt <= :now',
              { failed: 'FAILED', now: new Date() },
            );
        }),
      )
      .orderBy('request.createdAt', 'ASC')
      .take(limit)
      .getMany();

    const results = [];
    for (const request of requests) {
      results.push(await this.processRequest(request.id));
    }
    return { processed: results.length, results };
  }

  async processRequest(id: number) {
    return this.dataSource.transaction(async (manager) => {
      const request = await manager.getRepository(FiscalIssueRequest).findOne({
        where: { id },
      });
      if (!request) return { id, status: 'NOT_FOUND' };
      if (!['PENDING_ISSUE', 'FAILED'].includes(request.status)) {
        return { id, status: request.status, skipped: true };
      }

      await manager.getRepository(FiscalIssueRequest).update(id, {
        status: 'PROCESSING',
      });

      const document = await manager.getRepository(FiscalDocument).findOne({
        where: { id: Number(request.fiscalDocumentId) },
        relations: ['items'],
      });
      if (!document) {
        await manager.getRepository(FiscalIssueRequest).update(id, {
          status: 'FAILED',
          lastError: 'Documento fiscal não encontrado.',
          nextRetryAt: this.nextRetryAt(request.attemptCount + 1),
          attemptCount: request.attemptCount + 1,
        });
        return { id, status: 'FAILED' };
      }

      try {
        const payload = await this.buildNfceIssuePayload(manager, request, document);
        let response = await this.fiscalAdapterClient.issueNfce(payload);
        if (
          response.status === 'FAILED' &&
          this.canEmitContingency(payload)
        ) {
          const contingencyPayload = this.withContingency(payload, response.message);
          response = await this.fiscalAdapterClient.issueNfce(contingencyPayload);
          await this.applyAdapterResponse(
            manager,
            request,
            document,
            contingencyPayload,
            response,
          );
          return { id, status: response.status };
        }
        await this.applyAdapterResponse(manager, request, document, payload, response);
        return { id, status: response.status };
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Erro inesperado.';
        await this.markFailed(manager, request, document, message, null);
        return { id, status: 'FAILED', message };
      }
    });
  }

  private async buildNfceIssuePayload(
    manager: EntityManager,
    request: FiscalIssueRequest,
    document: FiscalDocument,
  ) {
    const [profile, nfceConfig, certificate, sale, client, payments] =
      await Promise.all([
        manager.getRepository(FiscalProfile).findOne({
          where: { id: Number(document.fiscalProfileId) },
        }),
        manager.getRepository(FiscalNfceConfig).findOne({
          where: {
            fiscalProfileId: Number(document.fiscalProfileId),
            environment: document.environment,
            isActive: true,
          },
        }),
        manager.getRepository(FiscalCertificateBinding).findOne({
          where: { fiscalProfileId: Number(document.fiscalProfileId), isActive: true },
          order: { createdAt: 'DESC' },
        }),
        manager.getRepository(Sale).findOne({
          where: { id: Number(document.saleId) },
        }),
        document.clientId
          ? manager.getRepository(Client).findOne({
              where: { id: Number(document.clientId) },
            })
          : Promise.resolve(null),
        manager.getRepository(Payment).find({
          where: { saleId: Number(document.saleId) },
          order: { id: 'ASC' },
        }),
      ]);

    if (!profile) throw new Error('Perfil fiscal do documento não encontrado.');
    if (!nfceConfig) throw new Error('Configuração NFC-e ativa não encontrada.');
    if (!certificate) throw new Error('Certificado A1 ativo não encontrado.');
    if (!sale) throw new Error('Venda vinculada ao documento não encontrada.');

    return {
      requestId: request.id,
      idempotencyKey: document.idempotencyKey,
      environment: document.environment,
      certificate: {
        storageMode: certificate.storageMode,
        storageKey: certificate.s3ObjectKey,
        contentBase64: await this.readCertificateBase64(certificate),
        password: this.fiscalCryptoService.decryptSecret(
          certificate.encryptedPassword,
        ),
      },
      nfce: {
        model: 65,
        series: document.series,
        number: document.number,
        issueDate: new Date().toISOString(),
        operationNature: 'VENDA',
        cscId: nfceConfig.cscId,
        csc: this.fiscalCryptoService.decryptSecret(nfceConfig.encryptedCsc),
      },
      contingency: {
        enabled: false,
        automaticAllowed: Boolean(nfceConfig.contingencyEnabled),
        mode: 'OFFLINE',
        reason: null,
      },
      issuer: this.serializeProfile(profile),
      consumer: client ? this.serializeClient(client) : null,
      items: (document.items || []).map((item, index) =>
        this.serializeItem(item, index + 1),
      ),
      payments: payments.map((payment) => ({
        paymentTypeCode: payment.fiscalPaymentTypeCode,
        amount: Number(payment.amount || 0),
        integrationType: payment.integrationType,
        authorizationCode: payment.authorizationCode,
        acquirerCnpj: payment.acquirerCnpj,
      })),
      totals: {
        productsAmount: Number(document.totalProductsAmount || 0),
        discountAmount: Number(document.discountAmount || 0),
        totalAmount: Number(document.totalAmount || sale.totalAmount || 0),
      },
    };
  }

  private canEmitContingency(payload: Record<string, unknown>) {
    const contingency = payload.contingency as
      | { automaticAllowed?: boolean; enabled?: boolean }
      | undefined;
    return Boolean(contingency?.automaticAllowed && !contingency.enabled);
  }

  private withContingency(
    payload: Record<string, unknown>,
    failureMessage?: string | null,
  ) {
    return {
      ...payload,
      contingency: {
        ...((payload.contingency as Record<string, unknown> | undefined) || {}),
        enabled: true,
        mode: 'OFFLINE',
        reason:
          failureMessage ||
          'Emissao em contingencia por indisponibilidade da SEFAZ.',
      },
    };
  }

  private async applyAdapterResponse(
    manager: EntityManager,
    request: FiscalIssueRequest,
    document: FiscalDocument,
    payload: Record<string, unknown>,
    response: FiscalAdapterIssueResponse,
  ) {
    const status = response.status;
    if (status === 'AUTHORIZED') {
      await this.storeArtifacts(manager, document, response);
      await manager.getRepository(FiscalDocument).update(document.id, {
        status: 'AUTHORIZED',
        accessKey: response.accessKey || null,
        protocolNumber: response.protocolNumber || null,
        issuedAt: new Date(),
        authorizedAt: response.authorizedAt
          ? new Date(response.authorizedAt)
          : new Date(),
        rawRequestJson: this.maskPayload(payload),
        rawResponseJson: this.normalizeRawResponse(response),
        errorMessage: null,
      });
      await manager.getRepository(FiscalIssueRequest).update(request.id, {
        status: 'AUTHORIZED',
        attemptCount: request.attemptCount + 1,
        lastError: null,
        nextRetryAt: null,
      });
      await this.updateSaleFiscalStatus(manager, document, 'ISSUED', false, null);
      await this.registerEvent(manager, document, 'AUTHORIZED', status, payload, response);
      return;
    }

    if (status === 'CONTINGENCY') {
      await this.storeArtifacts(manager, document, response, 'CONTINGENCY');
      const message =
        response.message ||
        'NFC-e emitida em contingência offline; transmissão posterior pendente.';
      await manager.getRepository(FiscalDocument).update(document.id, {
        status: 'CONTINGENCY',
        accessKey: response.accessKey || null,
        protocolNumber: null,
        issuedAt: new Date(),
        authorizedAt: null,
        contingencyMode: 'OFFLINE',
        rawRequestJson: this.maskPayload(payload),
        rawResponseJson: this.normalizeRawResponse(response),
        errorMessage: message,
      });
      await manager.getRepository(FiscalIssueRequest).update(request.id, {
        status: 'FAILED',
        attemptCount: request.attemptCount + 1,
        lastError: message,
        nextRetryAt: this.nextRetryAt(request.attemptCount + 1),
      });
      await this.updateSaleFiscalStatus(
        manager,
        document,
        'CONTINGENCY',
        true,
        message,
      );
      await this.registerEvent(
        manager,
        document,
        'CONTINGENCY_ISSUED',
        status,
        payload,
        response,
      );
      return;
    }

    if (status === 'REJECTED' || status === 'DENIED') {
      await manager.getRepository(FiscalDocument).update(document.id, {
        status,
        rawRequestJson: this.maskPayload(payload),
        rawResponseJson: this.normalizeRawResponse(response),
        errorMessage: response.message || status,
      });
      await manager.getRepository(FiscalIssueRequest).update(request.id, {
        status,
        attemptCount: request.attemptCount + 1,
        lastError: response.message || status,
        nextRetryAt: null,
      });
      await this.updateSaleFiscalStatus(
        manager,
        document,
        status,
        true,
        response.message || 'NFC-e rejeitada pela SEFAZ.',
      );
      await this.registerEvent(manager, document, status, status, payload, response);
      return;
    }

    await this.markFailed(
      manager,
      request,
      document,
      response.message || status,
      response,
      payload,
    );
  }

  private async markFailed(
    manager: EntityManager,
    request: FiscalIssueRequest,
    document: FiscalDocument,
    message: string,
    response: FiscalAdapterIssueResponse | null,
    payload?: Record<string, unknown> | null,
  ) {
    const attemptCount = request.attemptCount + 1;
    await manager.getRepository(FiscalDocument).update(document.id, {
      status: 'ISSUE_FAILED',
      rawRequestJson: payload ? this.maskPayload(payload) : null,
      rawResponseJson: response ? this.normalizeRawResponse(response) : null,
      errorMessage: message,
    });
    await manager.getRepository(FiscalIssueRequest).update(request.id, {
      status: 'FAILED',
      attemptCount,
      lastError: message,
      nextRetryAt: this.nextRetryAt(attemptCount),
    });
    await this.updateSaleFiscalStatus(
      manager,
      document,
      'PENDING_ISSUE',
      true,
      message,
    );
    await this.registerEvent(
      manager,
      document,
      'ISSUE_FAILED',
      'FAILED',
      payload || null,
      response || { status: 'FAILED', message },
    );
  }

  private async storeArtifacts(
    manager: EntityManager,
    document: FiscalDocument,
    response: FiscalAdapterIssueResponse,
    mode: 'AUTHORIZED' | 'CONTINGENCY' = 'AUTHORIZED',
  ) {
    const baseUrl =
      this.configService.get<string>('API_PUBLIC_BASE_URL') ||
      this.configService.get<string>('APP_PUBLIC_URL') ||
      'http://localhost:3000';

    if (response.xml) {
      await this.storeFile(manager, document, {
        fileType: mode === 'CONTINGENCY' ? 'XML_CONTINGENCY' : 'XML_AUTHORIZED',
        originalname: `nfce-${document.series}-${document.number}${
          mode === 'CONTINGENCY' ? '-contingencia' : ''
        }.xml`,
        mimetype: 'application/xml',
        buffer: Buffer.from(response.xml, 'utf8'),
        requestBaseUrl: baseUrl,
      });
    }
    if (response.danfePdfBase64) {
      await this.storeFile(manager, document, {
        fileType:
          mode === 'CONTINGENCY'
            ? 'DANFE_NFCE_CONTINGENCY_PDF'
            : 'DANFE_NFCE_PDF',
        originalname: `danfe-nfce-${document.series}-${document.number}${
          mode === 'CONTINGENCY' ? '-contingencia' : ''
        }.pdf`,
        mimetype: 'application/pdf',
        buffer: Buffer.from(response.danfePdfBase64, 'base64'),
        requestBaseUrl: baseUrl,
      });
    }
  }

  private async storeFile(
    manager: EntityManager,
    document: FiscalDocument,
    params: {
      fileType: string;
      originalname: string;
      mimetype: string;
      buffer: Buffer;
      requestBaseUrl: string;
    },
  ) {
    const uploaded = await this.fileStorageService.uploadBinaryFile(
      {
        buffer: params.buffer,
        originalname: params.originalname,
        mimetype: params.mimetype,
        size: params.buffer.length,
      },
      {
        folder: `fiscal/documents/${document.id}`,
        requestBaseUrl: params.requestBaseUrl,
        allowedMimeTypes: ['application/xml', 'text/xml', 'application/pdf'],
        maxFileSizeBytes: 10 * 1024 * 1024,
        cacheControl: 'private, max-age=0, no-store',
      },
    );
    await manager.getRepository(FiscalDocumentFile).save(
      manager.getRepository(FiscalDocumentFile).create({
        fiscalDocumentId: document.id,
        fileType: params.fileType,
        storageBackend:
          this.configService.get<string>('NODE_ENV') === 'production'
            ? 'S3'
            : 'LOCAL',
        storagePath: uploaded.storageKey,
        checksum: createHash('sha256').update(params.buffer).digest('hex'),
      }),
    );
  }

  private async updateSaleFiscalStatus(
    manager: EntityManager,
    document: FiscalDocument,
    fiscalStatus: string,
    hasFiscalPending: boolean,
    fiscalNotes: string | null,
  ) {
    if (!document.saleId) return;
    await manager.getRepository(Sale).update(document.saleId, {
      fiscalStatus,
      hasFiscalPending,
      fiscalNotes,
    });
  }

  private async registerEvent(
    manager: EntityManager,
    document: FiscalDocument,
    eventType: string,
    status: string,
    payload: Record<string, unknown> | null,
    response: unknown,
  ) {
    await manager.getRepository(FiscalDocumentEvent).save(
      manager.getRepository(FiscalDocumentEvent).create({
        fiscalDocumentId: document.id,
        eventType,
        status,
        protocolNumber:
          typeof response === 'object' && response
            ? String((response as { protocolNumber?: unknown }).protocolNumber || '') || null
            : null,
        payloadJson: payload ? this.maskPayload(payload) : null,
        responseJson: response ? this.normalizeRawResponse(response) : null,
        occurredAt: new Date(),
      }),
    );
  }

  private async readCertificateBase64(certificate: FiscalCertificateBinding) {
    const buffer = await this.fileStorageService.readBinaryFile(
      certificate.s3ObjectKey,
      certificate.s3Bucket,
    );
    return buffer.toString('base64');
  }

  private serializeProfile(profile: FiscalProfile) {
    return {
      name: profile.legalName,
      tradeName: profile.tradeName,
      document: profile.cnpj,
      ie: profile.ie,
      im: profile.im,
      crt: profile.crt,
      cnae: profile.cnae,
      email: profile.email,
      phone: profile.phone,
      address: {
        street: profile.street,
        number: profile.number,
        complement: profile.complement,
        district: profile.district,
        city: profile.city,
        state: profile.state,
        zipCode: profile.zipCode,
        ibgeCityCode: profile.ibgeCityCode,
        countryCode: profile.countryCode || '1058',
        countryName: 'Brasil',
      },
    };
  }

  private serializeClient(client: Client) {
    return {
      name: client.name,
      document: client.document,
      personType: client.personType,
      ie: client.stateTaxId,
      im: client.municipalTaxId,
      stateTaxpayerType: client.stateTaxpayerType,
      email: client.taxEmail || client.email,
      phone: client.mobilePhone || client.phone,
      address: {
        street: client.street,
        number: client.number,
        complement: client.complement,
        district: client.district,
        city: client.city,
        state: client.state,
        zipCode: client.zipCode,
        ibgeCityCode: client.ibgeCityCode,
        countryCode: client.countryCode || '1058',
        countryName: client.countryName || 'Brasil',
      },
    };
  }

  private serializeItem(item: FiscalDocumentItem, itemNumber: number) {
    const snapshot = item.taxSnapshotJson || {};
    return {
      itemNumber,
      description: item.description,
      ncm: item.ncm,
      cest: item.cest,
      cfop: item.cfop,
      ean: snapshot.fiscalEan || 'SEM GTIN',
      eanTributable: snapshot.fiscalEanTributable || snapshot.fiscalEan || 'SEM GTIN',
      commercialUnit: item.commercialUnit || item.taxUnit || 'UN',
      taxUnit: item.taxUnit || item.commercialUnit || 'UN',
      quantity: Number(item.quantity || 0),
      unitAmount: Number(item.unitAmount || 0),
      grossAmount: Number(item.grossAmount || 0),
      discountAmount: Number(item.discountAmount || 0),
      totalAmount: Number(item.totalAmount || 0),
      origin: snapshot.fiscalOrigin,
      icmsCst: snapshot.fiscalIcmsCst,
      icmsCsosn: snapshot.fiscalIcmsCsosn,
      pisCst: snapshot.fiscalPisCst,
      cofinsCst: snapshot.fiscalCofinsCst,
    };
  }

  private nextRetryAt(attemptCount: number) {
    const minutes = Math.min(60, Math.max(1, Math.pow(2, attemptCount - 1)));
    return new Date(Date.now() + minutes * 60 * 1000);
  }

  private maskPayload(payload: Record<string, unknown>) {
    return JSON.parse(
      JSON.stringify(payload, (key, value) => {
        if (['password', 'csc', 'contentBase64'].includes(key)) {
          return value ? '***' : value;
        }
        return value;
      }),
    );
  }

  private normalizeRawResponse(response: unknown) {
    return JSON.parse(JSON.stringify(response));
  }
}
