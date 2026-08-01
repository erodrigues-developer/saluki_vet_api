import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { randomUUID } from 'crypto';
import { existsSync, readFileSync } from 'fs';
import { dirname, join } from 'path';
import { DataSource, EntityManager, In } from 'typeorm';
import { ClinicSettings } from '../clinic-settings/entities/clinic-settings.entity';
import { FileStorageService } from '../file-storage/file-storage.service';
import { PaymentMethod } from '../payment-methods/entities/payment-method.entity';
import { Product } from '../products/entities/product.entity';
import { SaleItem } from '../sale-items/entities/sale-item.entity';
import { Sale } from '../sales/entities/sale.entity';
import { FiscalCertificateBinding } from './entities/fiscal-certificate-binding.entity';
import { FiscalDocumentFile } from './entities/fiscal-document-file.entity';
import { FiscalDocument } from './entities/fiscal-document.entity';
import { FiscalDocumentEvent } from './entities/fiscal-document-event.entity';
import { FiscalDocumentItem } from './entities/fiscal-document-item.entity';
import { FiscalDocumentSequence } from './entities/fiscal-document-sequence.entity';
import { FiscalIssueRequest } from './entities/fiscal-issue-request.entity';
import { FiscalNfceConfig } from './entities/fiscal-nfce-config.entity';
import { FiscalProfile } from './entities/fiscal-profile.entity';
import { FiscalCryptoService } from './fiscal-crypto.service';
import {
  FISCAL_PAYMENT_TYPE_CODES,
  FISCAL_PAYMENT_TYPES,
  normalizeFiscalPaymentTypeCode,
} from './fiscal-payment-types';

const FISCAL_MODES = new Set([
  'INATIVO',
  'ATIVO_ASSINCRONO',
  'ATIVO_SINCRONO',
]);
const ENVIRONMENTS = new Set(['HOMOLOG', 'PROD']);
const BRAZIL_UFS = [
  'AC',
  'AL',
  'AP',
  'AM',
  'BA',
  'CE',
  'DF',
  'ES',
  'GO',
  'MA',
  'MT',
  'MS',
  'MG',
  'PA',
  'PB',
  'PR',
  'PE',
  'PI',
  'RJ',
  'RN',
  'RS',
  'RO',
  'RR',
  'SC',
  'SP',
  'SE',
  'TO',
];
const BRASIL_API_NCM_URL = 'https://brasilapi.com.br/api/ncm/v1';
const IBGE_LOCALIDADES_URL =
  'https://servicodados.ibge.gov.br/api/v1/localidades';

type FiscalCfopOption = {
  codigo: string;
  descricao: string;
  direction: 'IN' | 'OUT';
};

type FiscalMunicipioOption = {
  codigoIbge: string;
  nome: string;
  uf: string;
};

@Injectable()
export class FiscalService {
  private cfopsCache: FiscalCfopOption[] | null = null;
  private municipiosCache = new Map<string, FiscalMunicipioOption[]>();

  constructor(
    private readonly dataSource: DataSource,
    private readonly configService: ConfigService,
    private readonly fileStorageService: FileStorageService,
    private readonly fiscalCryptoService: FiscalCryptoService,
  ) {}

  async getSettingsSummary() {
    const [profiles, documentsPending, contingencyPending, rejected] =
      await Promise.all([
        this.profileRepository().find({
          relations: ['nfceConfigs', 'certificates'],
          order: { id: 'ASC' },
        }),
        this.documentRepository().count({
          where: [
            { status: 'PENDING_ISSUE' },
            { status: 'PROCESSING' },
            { status: 'RETRY_SCHEDULED' },
          ],
        }),
        this.documentRepository().count({
          where: [
            { status: 'CONTINGENCY_ISSUED' },
            { status: 'CONTINGENCY_PENDING_TRANSMISSION' },
          ],
        }),
        this.documentRepository().count({ where: { status: 'REJECTED' } }),
      ]);

    return {
      profiles: profiles.map((profile) => this.serializeProfile(profile)),
      counters: {
        documentsPending,
        contingencyPending,
        rejected,
      },
    };
  }

  async listProfiles() {
    const profiles = await this.profileRepository().find({
      relations: ['nfceConfigs', 'certificates'],
      order: { id: 'ASC' },
    });
    return profiles.map((profile) => this.serializeProfile(profile));
  }

  async searchNcm(search: string) {
    const normalizedSearch = String(search || '').trim();
    if (normalizedSearch.length < 3) return [];

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);

    try {
      const response = await fetch(
        `${BRASIL_API_NCM_URL}?search=${encodeURIComponent(normalizedSearch)}`,
        {
          signal: controller.signal,
          headers: { accept: 'application/json' },
        },
      );
      if (!response.ok) {
        throw new BadRequestException('Falha ao consultar NCM na BrasilAPI.');
      }

      const data = await response.json();
      return (Array.isArray(data) ? data : [])
        .map((item: any) => {
          const code = this.optionalDigits(item?.codigo);
          const description = String(item?.descricao || '').trim();
          return {
            codigo: code,
            descricao: description,
            dataInicio: item?.data_inicio || null,
            dataFim: item?.data_fim || null,
            atoLegal: item?.ato_legal || null,
          };
        })
        .filter((item) => item.codigo?.length === 8 && item.descricao)
        .slice(0, 20);
    } catch (error) {
      if (error instanceof BadRequestException) throw error;
      throw new BadRequestException('Falha ao consultar NCM na BrasilAPI.');
    } finally {
      clearTimeout(timeout);
    }
  }

  searchCfops(search: string, direction = 'OUT') {
    const normalizedSearch = this.normalizeSearchText(search);
    if (normalizedSearch.length < 2) return [];

    const normalizedDirection = String(direction || 'OUT')
      .trim()
      .toUpperCase();
    const cfops = this.loadCfops();

    return cfops
      .filter((cfop) => {
        if (normalizedDirection === 'OUT' && cfop.direction !== 'OUT') return false;
        if (normalizedDirection === 'IN' && cfop.direction !== 'IN') return false;
        const haystack = this.normalizeSearchText(
          `${cfop.codigo} ${cfop.descricao}`,
        );
        return haystack.includes(normalizedSearch);
      })
      .slice(0, 30);
  }

  async searchMunicipios(uf: string, search: string) {
    const normalizedUf = String(uf || '')
      .trim()
      .toUpperCase();
    const normalizedSearch = this.normalizeSearchText(search);
    if (normalizedSearch.length < 2) return [];

    const municipios = /^[A-Z]{2}$/.test(normalizedUf)
      ? await this.loadMunicipios(normalizedUf)
      : (await Promise.all(BRAZIL_UFS.map((item) => this.loadMunicipios(item))))
          .flat();
    return municipios
      .filter((municipio) => {
        const haystack = this.normalizeSearchText(
          `${municipio.codigoIbge} ${municipio.nome} ${municipio.uf}`,
        );
        return haystack.includes(normalizedSearch);
      })
      .slice(0, 30);
  }

  listPaymentTypes() {
    return FISCAL_PAYMENT_TYPES;
  }

  async upsertProfile(payload: any) {
    const id = Number(payload?.id || 0);
    const repository = this.profileRepository();
    const current = id
      ? await repository.findOne({
          where: { id },
          relations: ['nfceConfigs', 'certificates'],
        })
      : null;

    if (id && !current) {
      throw new NotFoundException(`Perfil fiscal ${id} não encontrado.`);
    }

    const fiscalMode = this.normalizeFiscalMode(payload?.fiscalMode);
    const entity = repository.create({
      ...(current || {}),
      code: this.requiredText(payload?.code, 'Código do perfil fiscal'),
      tradeName: this.requiredText(payload?.tradeName, 'Nome fantasia'),
      legalName: this.requiredText(payload?.legalName, 'Razão social'),
      cnpj: this.onlyDigits(payload?.cnpj, 'CNPJ'),
      cpf: this.optionalDigits(payload?.cpf),
      ie: this.optionalText(payload?.ie),
      im: this.optionalText(payload?.im),
      cnae: this.optionalText(payload?.cnae),
      crt: this.optionalText(payload?.crt),
      taxRegime: this.optionalText(payload?.taxRegime),
      phone: this.optionalText(payload?.phone),
      email: this.optionalText(payload?.email),
      street: this.optionalText(payload?.street),
      number: this.optionalText(payload?.number),
      complement: this.optionalText(payload?.complement),
      district: this.optionalText(payload?.district),
      city: this.optionalText(payload?.city),
      state: this.optionalText(payload?.state)?.toUpperCase() || null,
      zipCode: this.optionalText(payload?.zipCode),
      ibgeCityCode: this.optionalDigits(payload?.ibgeCityCode),
      countryCode: this.optionalText(payload?.countryCode) || '1058',
      fiscalMode,
      isActive: payload?.isActive !== undefined ? Boolean(payload.isActive) : true,
    });

    const saved = await repository.save(entity);
    await this.syncClinicFiscalDefaults(saved);
    const reloaded = await repository.findOne({
      where: { id: saved.id },
      relations: ['nfceConfigs', 'certificates'],
    });
    return this.serializeProfile(reloaded || saved);
  }

  async upsertNfceConfig(profileId: number, payload: any) {
    await this.ensureProfile(profileId);
    const environment = this.normalizeEnvironment(payload?.environment);
    const series = Number(payload?.series);
    if (!Number.isInteger(series) || series <= 0) {
      throw new BadRequestException('Série da NFC-e deve ser maior que zero.');
    }

    const cscId = this.requiredCscId(payload?.cscId);
    const repository = this.dataSource.getRepository(FiscalNfceConfig);
    const current = await repository.findOne({
      where: { fiscalProfileId: profileId, environment },
    });
    const csc = this.optionalText(payload?.csc);
    if (!csc && !current?.encryptedCsc) {
      throw new BadRequestException('CSC é obrigatório.');
    }

    const saved = await repository.save(
      repository.create({
        ...(current || {}),
        fiscalProfileId: profileId,
        environment,
        series,
        cscId,
        encryptedCsc: csc
          ? this.fiscalCryptoService.encryptSecret(csc)
          : current?.encryptedCsc,
        contingencyEnabled: Boolean(payload?.contingencyEnabled),
        contingencyAlertAfterMinutes: this.positiveInteger(
          payload?.contingencyAlertAfterMinutes,
          60,
        ),
        contingencyCriticalAfterMinutes: this.positiveInteger(
          payload?.contingencyCriticalAfterMinutes,
          720,
        ),
        isActive: payload?.isActive !== undefined ? Boolean(payload.isActive) : true,
      }),
    );

    await this.ensureSequence(profileId, 'NFCE', environment, series);
    return this.serializeNfceConfig(saved);
  }

  async uploadCertificate(
    profileId: number,
    file: {
      buffer?: Buffer;
      originalname?: string;
      mimetype?: string;
      size?: number;
    },
    payload: any,
    requestBaseUrl: string,
  ) {
    await this.ensureProfile(profileId);
    if (!file?.buffer?.length) {
      throw new BadRequestException('Certificado A1 não enviado.');
    }
    if (!String(file.originalname || '').toLowerCase().endsWith('.pfx')) {
      throw new BadRequestException('Envie um certificado A1 no formato .pfx.');
    }

    const password = this.requiredText(payload?.password, 'Senha do certificado');
    const storedFile = await this.storeCertificateFile(
      profileId,
      file,
      requestBaseUrl,
    );

    await this.dataSource.getRepository(FiscalCertificateBinding).update(
      { fiscalProfileId: profileId, isActive: true },
      { isActive: false },
    );

    const saved = await this.dataSource
      .getRepository(FiscalCertificateBinding)
      .save({
        fiscalProfileId: profileId,
        certificateType: 'A1',
        storageMode: storedFile.storageMode,
        s3Bucket: storedFile.bucket,
        s3ObjectKey: storedFile.key,
        encryptedPassword: this.fiscalCryptoService.encryptSecret(password),
        encryptionKeyRef: this.optionalText(payload?.encryptionKeyRef),
        serialNumber: this.optionalText(payload?.serialNumber),
        subjectName: this.optionalText(payload?.subjectName),
        issuerName: this.optionalText(payload?.issuerName),
        validFrom: this.optionalDate(payload?.validFrom),
        validTo: this.optionalDate(payload?.validTo),
        cacheInvalidationToken: randomUUID(),
        isActive: true,
      });

    return this.serializeCertificate(saved);
  }

  async updateCertificatePassword(profileId: number, payload: any) {
    await this.ensureProfile(profileId);
    const password = this.requiredText(payload?.password, 'Senha do certificado');
    const repository = this.dataSource.getRepository(FiscalCertificateBinding);
    const certificate = await repository.findOne({
      where: { fiscalProfileId: profileId, isActive: true },
      order: { updatedAt: 'DESC' },
    });
    if (!certificate) {
      throw new NotFoundException('Certificado A1 ativo não encontrado.');
    }

    certificate.encryptedPassword =
      this.fiscalCryptoService.encryptSecret(password);
    certificate.cacheInvalidationToken = randomUUID();
    const saved = await repository.save(certificate);
    return this.serializeCertificate(saved);
  }

  private async storeCertificateFile(
    profileId: number,
    file: {
      buffer?: Buffer;
      originalname?: string;
      mimetype?: string;
      size?: number;
    },
    requestBaseUrl: string,
  ) {
    const uploaded = await this.fileStorageService.uploadBinaryFile(file, {
      folder: `fiscal/certificates/${profileId}`,
      requestBaseUrl,
      allowedMimeTypes: [
        'application/x-pkcs12',
        'application/pkcs12',
        'application/octet-stream',
      ],
      maxFileSizeBytes: 2 * 1024 * 1024,
      cacheControl: 'private, no-store',
    });

    return {
      storageMode: this.isProductionUpload() ? 'S3' : 'LOCAL',
      bucket: this.isProductionUpload()
        ? this.configService.get<string>('aws.s3.bucket')
        : 'LOCAL',
      key: uploaded.storageKey,
    };
  }

  private isProductionUpload() {
    return this.configService.get<string>('NODE_ENV') === 'production';
  }

  async listDocuments(query: any) {
    const qb = this.documentRepository()
      .createQueryBuilder('document')
      .leftJoinAndSelect('document.fiscalProfile', 'profile')
      .leftJoinAndSelect('document.client', 'client')
      .orderBy('document.createdAt', 'DESC');

    if (query?.status) qb.andWhere('document.status = :status', { status: query.status });
    if (query?.documentType) {
      qb.andWhere('document.documentType = :documentType', {
        documentType: String(query.documentType).toUpperCase(),
      });
    }
    if (query?.environment) {
      qb.andWhere('document.environment = :environment', {
        environment: this.normalizeEnvironment(query.environment),
      });
    }
    if (query?.saleId) {
      qb.andWhere('document.saleId = :saleId', { saleId: Number(query.saleId) });
    }

    const page = Math.max(1, Number(query?.page || 1));
    const limit = Math.min(100, Math.max(1, Number(query?.limit || 20)));
    const [data, total] = await qb
      .skip((page - 1) * limit)
      .take(limit)
      .getManyAndCount();
    const issueRequests = data.length
      ? await this.dataSource.getRepository(FiscalIssueRequest).find({
          where: {
            fiscalDocumentId: In(data.map((document) => document.id)),
            requestType: 'ISSUE',
          },
          order: { createdAt: 'DESC' },
        })
      : [];
    const events = data.length
      ? await this.dataSource.getRepository(FiscalDocumentEvent).find({
          where: { fiscalDocumentId: In(data.map((document) => document.id)) },
          order: { occurredAt: 'DESC', createdAt: 'DESC' },
        })
      : [];
    const files = data.length
      ? await this.dataSource.getRepository(FiscalDocumentFile).find({
          where: { fiscalDocumentId: In(data.map((document) => document.id)) },
          order: { createdAt: 'DESC' },
        })
      : [];
    const latestIssueRequestByDocumentId = new Map<number, FiscalIssueRequest>();
    for (const request of issueRequests) {
      const documentId = Number(request.fiscalDocumentId);
      if (!latestIssueRequestByDocumentId.has(documentId)) {
        latestIssueRequestByDocumentId.set(documentId, request);
      }
    }
    const eventsByDocumentId = new Map<number, FiscalDocumentEvent[]>();
    for (const event of events) {
      const documentId = Number(event.fiscalDocumentId);
      eventsByDocumentId.set(documentId, [
        ...(eventsByDocumentId.get(documentId) || []),
        event,
      ]);
    }
    const filesByDocumentId = new Map<number, FiscalDocumentFile[]>();
    for (const file of files) {
      const documentId = Number(file.fiscalDocumentId);
      filesByDocumentId.set(documentId, [
        ...(filesByDocumentId.get(documentId) || []),
        file,
      ]);
    }

    return {
      data: data.map((document) => ({
        ...document,
        latestIssueRequest:
          latestIssueRequestByDocumentId.get(Number(document.id)) || null,
        recentEvents: (eventsByDocumentId.get(Number(document.id)) || []).slice(0, 10),
        files: (filesByDocumentId.get(Number(document.id)) || []).map((file) =>
          this.serializeDocumentFile(file),
        ),
      })),
      meta: { page, limit, total },
    };
  }

  async downloadDocumentFile(fileId: number) {
    const file = await this.dataSource.getRepository(FiscalDocumentFile).findOne({
      where: { id: fileId },
      relations: ['fiscalDocument'],
    });
    if (!file) {
      throw new NotFoundException('Artefato fiscal não encontrado.');
    }
    const buffer = await this.fileStorageService.readBinaryFile(file.storagePath);
    return {
      buffer,
      mimeType: this.fiscalFileMimeType(file.fileType),
      fileName: this.fiscalFileName(file),
    };
  }

  async listIssueRequests(query: any) {
    const repository = this.dataSource.getRepository(FiscalIssueRequest);
    const page = Math.max(1, Number(query?.page || 1));
    const limit = Math.min(100, Math.max(1, Number(query?.limit || 20)));
    const where = query?.status ? { status: String(query.status) } : {};
    const [data, total] = await repository.findAndCount({
      where,
      relations: ['fiscalDocument'],
      order: { createdAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });
    return { data, meta: { page, limit, total } };
  }

  async prepareSaleCheckoutFiscal(
    manager: EntityManager,
    sale: Sale,
    paymentMethods: PaymentMethod[],
  ): Promise<{
    fiscalStatus: string;
    hasFiscalPending: boolean;
    fiscalNotes?: string | null;
    createIssueRequest: boolean;
    fiscalProfileId?: number;
    environment?: string;
    series?: number;
    fiscalMode?: string;
  }> {
    const settings = await manager.getRepository(ClinicSettings).findOne({
      where: {},
    });
    if (!settings?.defaultFiscalProfileId || !settings.fiscalModuleEnabled) {
      return {
        fiscalStatus: 'NOT_REQUIRED',
        hasFiscalPending: false,
        fiscalNotes: null,
        createIssueRequest: false,
      };
    }

    const profile = await manager.getRepository(FiscalProfile).findOne({
      where: { id: Number(settings.defaultFiscalProfileId), isActive: true },
      relations: ['nfceConfigs', 'certificates'],
    });
    if (!profile || profile.fiscalMode === 'INATIVO') {
      return {
        fiscalStatus: 'NOT_REQUIRED',
        hasFiscalPending: false,
        fiscalNotes: null,
        createIssueRequest: false,
      };
    }

    const items = await manager.getRepository(SaleItem).find({
      where: { saleId: sale.id },
      relations: ['product', 'procedure'],
      order: { id: 'ASC' },
    });
    if (!items.length) {
      throw new BadRequestException(
        'Venda sem itens não pode passar pela validação fiscal.',
      );
    }

    const classification = this.classifySaleItems(items);
    if (!classification.hasOnlyPhysicalProducts) {
      return {
        fiscalStatus: 'NOT_SUPPORTED',
        hasFiscalPending: true,
        fiscalNotes:
          'MVP NFC-e emite automaticamente apenas vendas compostas exclusivamente por mercadorias.',
        createIssueRequest: false,
      };
    }

    const environment = this.resolveProfileEnvironment(profile);
    const nfceConfig = profile.nfceConfigs?.find(
      (config) => config.environment === environment && config.isActive,
    );
    const activeCertificate = profile.certificates?.find(
      (certificate) => certificate.isActive,
    );
    const validationErrors = this.validateNfceCheckoutReadiness({
      profile,
      nfceConfig,
      activeCertificate,
      products: classification.products,
      paymentMethods,
    });
    if (validationErrors.length) {
      throw new BadRequestException({
        message: 'Corrija os dados fiscais antes de concluir o checkout.',
        fiscalStatus: 'VALIDATION_FAILED',
        errors: validationErrors,
      });
    }

    return {
      fiscalStatus: 'PENDING_ISSUE',
      hasFiscalPending: true,
      fiscalNotes: null,
      createIssueRequest: true,
      fiscalProfileId: profile.id,
      environment,
      series: nfceConfig.series,
      fiscalMode: profile.fiscalMode,
    };
  }

  async createSaleNfceIssueRequest(
    manager: EntityManager,
    params: {
      sale: Sale;
      fiscalProfileId: number;
      environment: string;
      series: number;
    },
  ) {
    const documentRepository = manager.getRepository(FiscalDocument);
    const existing = await documentRepository.findOne({
      where: {
        idempotencyKey: this.buildSaleNfceIdempotencyKey(
          params.sale.id,
          params.environment,
        ),
      },
    });
    if (existing) return existing;

    const sequence = await this.reserveNextNumber(manager, {
      fiscalProfileId: params.fiscalProfileId,
      documentType: 'NFCE',
      environment: params.environment,
      series: params.series,
    });

    const items = await manager.getRepository(SaleItem).find({
      where: { saleId: params.sale.id },
      relations: ['product'],
      order: { id: 'ASC' },
    });
    const document = await documentRepository.save(
      documentRepository.create({
        saleId: params.sale.id,
        sourceType: 'SALE',
        documentType: 'NFCE',
        fiscalProfileId: params.fiscalProfileId,
        clientId: params.sale.clientId ?? null,
        status: 'PENDING_ISSUE',
        environment: params.environment,
        series: params.series,
        number: sequence.currentNumber,
        idempotencyKey: this.buildSaleNfceIdempotencyKey(
          params.sale.id,
          params.environment,
        ),
        totalProductsAmount: params.sale.totalAmount,
        totalServicesAmount: 0,
        discountAmount: params.sale.discountAmount || 0,
        totalAmount: params.sale.totalAmount,
      }),
    );

    await manager.getRepository(FiscalDocumentEvent).save(
      manager.getRepository(FiscalDocumentEvent).create({
        fiscalDocumentId: document.id,
        eventType: 'ISSUE_REQUEST_CREATED',
        status: document.status,
        payloadJson: {
          saleId: params.sale.id,
          documentType: 'NFCE',
          environment: params.environment,
          series: params.series,
          number: sequence.currentNumber,
        },
        occurredAt: new Date(),
      }),
    );

    await this.createFiscalDocumentItems(manager, document, items);

    await manager.getRepository(FiscalIssueRequest).save(
      manager.getRepository(FiscalIssueRequest).create({
        saleId: params.sale.id,
        fiscalDocumentId: document.id,
        documentType: 'NFCE',
        requestType: 'ISSUE',
        status: 'PENDING_ISSUE',
        attemptCount: 0,
        payloadJson: {
          idempotencyKey: document.idempotencyKey,
          saleId: params.sale.id,
          fiscalDocumentId: document.id,
        },
      }),
    );

    await manager.getRepository(Sale).update(params.sale.id, {
      issuedProductDocumentId: document.id,
    });
    await manager.getRepository(SaleItem).update(
      { saleId: params.sale.id },
      {
        fiscalDocumentId: document.id,
        fiscalStatus: 'PENDING_ISSUE',
        fiscalGroup: 'PRODUCT',
      },
    );

    return document;
  }

  async ensureSequence(
    fiscalProfileId: number,
    documentType: string,
    environment: string,
    series: number,
    manager?: EntityManager,
  ) {
    const repository = (manager || this.dataSource.manager).getRepository(
      FiscalDocumentSequence,
    );
    const normalizedType = String(documentType || '').trim().toUpperCase();
    const normalizedEnvironment = this.normalizeEnvironment(environment);
    const current = await repository.findOne({
      where: {
        fiscalProfileId,
        documentType: normalizedType,
        environment: normalizedEnvironment,
        series,
      },
    });
    if (current) return current;
    return repository.save(
      repository.create({
        fiscalProfileId,
        documentType: normalizedType,
        environment: normalizedEnvironment,
        series,
        currentNumber: 0,
      }),
    );
  }

  private async reserveNextNumber(
    manager: EntityManager,
    params: {
      fiscalProfileId: number;
      documentType: string;
      environment: string;
      series: number;
    },
  ) {
    await this.ensureSequence(
      params.fiscalProfileId,
      params.documentType,
      params.environment,
      params.series,
      manager,
    );
    const repository = manager.getRepository(FiscalDocumentSequence);
    const sequence = await repository
      .createQueryBuilder('sequence')
      .setLock('pessimistic_write')
      .where('sequence.fiscalProfileId = :fiscalProfileId', {
        fiscalProfileId: params.fiscalProfileId,
      })
      .andWhere('sequence.documentType = :documentType', {
        documentType: params.documentType,
      })
      .andWhere('sequence.environment = :environment', {
        environment: params.environment,
      })
      .andWhere('sequence.series = :series', { series: params.series })
      .getOne();

    if (!sequence) {
      throw new BadRequestException('Sequência fiscal não encontrada.');
    }
    sequence.currentNumber = Number(sequence.currentNumber || 0) + 1;
    sequence.lastUsedAt = new Date();
    return repository.save(sequence);
  }

  async createEvent(params: {
    fiscalDocumentId: number;
    eventType: string;
    status: string;
    payloadJson?: Record<string, unknown> | null;
    responseJson?: Record<string, unknown> | null;
    justification?: string | null;
    manager?: EntityManager;
  }) {
    const repository = (params.manager || this.dataSource.manager).getRepository(
      FiscalDocumentEvent,
    );
    return repository.save(
      repository.create({
        fiscalDocumentId: params.fiscalDocumentId,
        eventType: params.eventType,
        status: params.status,
        payloadJson: this.maskPayload(params.payloadJson),
        responseJson: this.maskPayload(params.responseJson),
        justification: params.justification,
        occurredAt: new Date(),
      }),
    );
  }

  private async ensureProfile(id: number) {
    const profile = await this.profileRepository().findOne({ where: { id } });
    if (!profile) throw new NotFoundException(`Perfil fiscal ${id} não encontrado.`);
    return profile;
  }

  private serializeProfile(profile: FiscalProfile) {
    return {
      ...profile,
      nfceConfigs: this.sortActiveFirst(profile.nfceConfigs).map((config) =>
        this.serializeNfceConfig(config),
      ),
      certificates: this.sortActiveFirst(profile.certificates).map(
        (certificate) => this.serializeCertificate(certificate),
      ),
    };
  }

  private sortActiveFirst<T extends { isActive?: boolean; updatedAt?: Date }>(
    items?: T[],
  ) {
    return [...(items || [])].sort((a, b) => {
      if (Boolean(a.isActive) !== Boolean(b.isActive)) {
        return a.isActive ? -1 : 1;
      }
      return (
        new Date(b.updatedAt || 0).getTime() -
        new Date(a.updatedAt || 0).getTime()
      );
    });
  }

  private serializeNfceConfig(config: FiscalNfceConfig) {
    return {
      ...config,
      encryptedCsc: undefined,
      cscMasked: this.fiscalCryptoService.maskSecret(config.cscId),
    };
  }

  private serializeCertificate(certificate: FiscalCertificateBinding) {
    return {
      ...certificate,
      encryptedPassword: undefined,
      passwordConfigured: Boolean(certificate.encryptedPassword),
    };
  }

  private serializeDocumentFile(file: FiscalDocumentFile) {
    return {
      id: file.id,
      fiscalDocumentId: file.fiscalDocumentId,
      fileType: file.fileType,
      label: this.fiscalFileLabel(file.fileType),
      extension: this.fiscalFileExtension(file.fileType),
      createdAt: file.createdAt,
    };
  }

  private fiscalFileLabel(fileType: string) {
    if (fileType.includes('XML')) return 'XML';
    if (fileType.includes('DANFE')) return 'DANFE';
    return fileType;
  }

  private fiscalFileExtension(fileType: string) {
    if (fileType.includes('XML')) return 'xml';
    if (fileType.includes('PDF') || fileType.includes('DANFE')) return 'pdf';
    return 'bin';
  }

  private fiscalFileMimeType(fileType: string) {
    if (fileType.includes('XML')) return 'application/xml';
    if (fileType.includes('PDF') || fileType.includes('DANFE')) return 'application/pdf';
    return 'application/octet-stream';
  }

  private fiscalFileName(file: FiscalDocumentFile) {
    const document = file.fiscalDocument;
    const documentType = document?.documentType || 'FISCAL';
    const series = document?.series || '0';
    const number = document?.number || file.fiscalDocumentId;
    return `${documentType}-${series}-${number}-${this.fiscalFileLabel(file.fileType).toLowerCase()}.${this.fiscalFileExtension(file.fileType)}`;
  }

  private maskPayload(payload?: Record<string, unknown> | null) {
    if (!payload) return payload;
    const secretKeys = new Set([
      'password',
      'senha',
      'csc',
      'encryptedCsc',
      'encryptedPassword',
      'certificate',
      'pfx',
      'token',
    ]);
    return JSON.parse(
      JSON.stringify(payload, (key, value) =>
        secretKeys.has(key) ? '***' : value,
      ),
    );
  }

  private classifySaleItems(items: SaleItem[]) {
    const products: Product[] = [];
    let serviceCount = 0;
    for (const item of items) {
      if (item.product && !item.product.isService) {
        products.push(item.product);
        continue;
      }
      serviceCount += 1;
    }
    return {
      products,
      hasOnlyPhysicalProducts: products.length === items.length && serviceCount === 0,
    };
  }

  private validateNfceCheckoutReadiness(params: {
    profile: FiscalProfile;
    nfceConfig?: FiscalNfceConfig | null;
    activeCertificate?: FiscalCertificateBinding | null;
    products: Product[];
    paymentMethods: PaymentMethod[];
  }) {
    const errors: string[] = [];
    const requiredProfileFields: Array<[string, unknown]> = [
      ['CNPJ do emitente', params.profile.cnpj],
      ['IE do emitente', params.profile.ie],
      ['CRT do emitente', params.profile.crt],
      ['UF do emitente', params.profile.state],
      ['Código IBGE do município do emitente', params.profile.ibgeCityCode],
    ];
    for (const [label, value] of requiredProfileFields) {
      if (!String(value || '').trim()) errors.push(`${label} não configurado.`);
    }
    if (!params.nfceConfig) errors.push('Configuração NFC-e do ambiente não cadastrada.');
    if (!params.activeCertificate) errors.push('Certificado A1 ativo não cadastrado.');

    for (const paymentMethod of params.paymentMethods) {
      const paymentTypeCode = normalizeFiscalPaymentTypeCode(
        paymentMethod.fiscalPaymentTypeCode,
      );
      if (!paymentTypeCode) {
        errors.push(
          `Forma de pagamento "${paymentMethod.name}" sem código fiscal NFC-e.`,
        );
      } else if (!FISCAL_PAYMENT_TYPE_CODES.has(paymentTypeCode)) {
        errors.push(
          `Forma de pagamento "${paymentMethod.name}" com código fiscal NFC-e inválido.`,
        );
      }
    }

    for (const product of params.products) {
      const missing = [
        ['NCM', product.fiscalNcm],
        ['origem', product.fiscalOrigin],
        ['CFOP NFC-e', product.fiscalCfopNfceDefault],
        ['unidade tributável', product.fiscalUnitTributable],
        ['fator de conversão', product.fiscalConversionFactor],
        ['CST PIS', product.fiscalPisCst],
        ['CST COFINS', product.fiscalCofinsCst],
      ].filter(([, value]) => !String(value || '').trim());
      if (!product.fiscalIcmsCst && !product.fiscalIcmsCsosn) {
        missing.push(['CST/CSOSN ICMS', null]);
      }
      if (product.fiscalIsBillable === false) {
        missing.push(['flag faturável fiscal', null]);
      }
      if (missing.length) {
        errors.push(
          `Produto "${product.name}" com fiscal incompleto: ${missing
            .map(([label]) => label)
            .join(', ')}.`,
        );
      }
    }
    return errors;
  }

  private async createFiscalDocumentItems(
    manager: EntityManager,
    document: FiscalDocument,
    saleItems: SaleItem[],
  ) {
    const repository = manager.getRepository(FiscalDocumentItem);
    for (const item of saleItems) {
      if (!item.product) continue;
      const quantity = Number(item.quantity || 0);
      const unitAmount = Number(item.unitPrice || 0);
      const grossAmount = this.normalizeMoney(quantity * unitAmount);
      const discountAmount = Number(item.discountAmount || 0);
      await repository.insert({
        fiscalDocumentId: document.id,
        saleItemId: item.id,
        sourceEntityType: 'PRODUCT',
        sourceEntityId: item.productId,
        description: item.product.name,
        ncm: item.product.fiscalNcm,
        cest: item.product.fiscalCest,
        cfop: item.product.fiscalCfopNfceDefault,
        quantity,
        commercialUnit: item.product.unit || item.product.saleUnit || 'un',
        taxUnit: item.product.fiscalUnitTributable,
        unitAmount,
        grossAmount,
        discountAmount,
        totalAmount: Number(item.totalPrice || 0),
        taxSnapshotJson: {
          fiscalNcm: item.product.fiscalNcm,
          fiscalCest: item.product.fiscalCest,
          fiscalOrigin: item.product.fiscalOrigin,
          fiscalCfopNfceDefault: item.product.fiscalCfopNfceDefault,
          fiscalEan: item.product.fiscalEan,
          fiscalEanTributable: item.product.fiscalEanTributable,
          fiscalUnitTributable: item.product.fiscalUnitTributable,
          fiscalConversionFactor: item.product.fiscalConversionFactor,
          fiscalIcmsCst: item.product.fiscalIcmsCst,
          fiscalIcmsCsosn: item.product.fiscalIcmsCsosn,
          fiscalPisCst: item.product.fiscalPisCst,
          fiscalCofinsCst: item.product.fiscalCofinsCst,
        },
      });
    }
  }

  private resolveProfileEnvironment(profile: FiscalProfile) {
    const configured =
      this.configService.get<string>('FISCAL_DEFAULT_ENVIRONMENT') || 'HOMOLOG';
    const normalized = String(configured).trim().toUpperCase();
    if (profile.nfceConfigs?.some((config) => config.environment === normalized)) {
      return normalized;
    }
    return profile.nfceConfigs?.[0]?.environment || normalized;
  }

  private buildSaleNfceIdempotencyKey(saleId: number, environment: string) {
    return `SALE:${saleId}:NFCE:${environment}:PRODUCT`;
  }

  private normalizeMoney(value: number | string) {
    const parsed = Number(value || 0);
    return Math.round((parsed + Number.EPSILON) * 100) / 100;
  }

  private profileRepository() {
    return this.dataSource.getRepository(FiscalProfile);
  }

  private documentRepository() {
    return this.dataSource.getRepository(FiscalDocument);
  }

  private loadCfops() {
    if (this.cfopsCache) return this.cfopsCache;
    const packageJsonPath = require.resolve('jansenfelipe-cfop/package.json');
    const csvPath = join(dirname(packageJsonPath), 'cfop.csv');
    if (!existsSync(csvPath)) {
      throw new BadRequestException('Lista local de CFOP não encontrada.');
    }
    const csv = readFileSync(csvPath, 'utf8');
    this.cfopsCache = csv
      .split(/\r?\n/)
      .map((line) => {
        const separatorIndex = line.indexOf(';');
        if (separatorIndex <= 0) return null;
        const codigo = line.slice(0, separatorIndex).replace(/\D/g, '');
        const descricao = line
          .slice(separatorIndex + 1)
          .trim()
          .replace(/^"|"$/g, '')
          .replace(/""/g, '"');
        if (codigo.length !== 4 || !descricao) return null;
        return {
          codigo,
          descricao,
          direction: ['5', '6', '7'].includes(codigo[0]) ? 'OUT' : 'IN',
        } as FiscalCfopOption;
      })
      .filter(Boolean) as FiscalCfopOption[];
    return this.cfopsCache;
  }

  private async loadMunicipios(uf: string) {
    const cached = this.municipiosCache.get(uf);
    if (cached) return cached;

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);
    try {
      const response = await fetch(
        `${IBGE_LOCALIDADES_URL}/estados/${encodeURIComponent(uf)}/municipios`,
        {
          signal: controller.signal,
          headers: { accept: 'application/json' },
        },
      );
      if (!response.ok) {
        throw new BadRequestException('Falha ao consultar municípios no IBGE.');
      }

      const data = await response.json();
      const municipios = (Array.isArray(data) ? data : [])
        .map((item: any) => ({
          codigoIbge: String(item?.id || '').replace(/\D/g, ''),
          nome: String(item?.nome || '').trim(),
          uf,
        }))
        .filter((item) => item.codigoIbge.length === 7 && item.nome)
        .sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR'));
      this.municipiosCache.set(uf, municipios);
      return municipios;
    } catch (error) {
      if (error instanceof BadRequestException) throw error;
      throw new BadRequestException('Falha ao consultar municípios no IBGE.');
    } finally {
      clearTimeout(timeout);
    }
  }

  private async syncClinicFiscalDefaults(profile: FiscalProfile) {
    const repository = this.dataSource.getRepository(ClinicSettings);
    let settings = await repository.findOne({ where: {} });
    if (!settings) {
      settings = repository.create({
        appointmentSlotDurationMinutes: 30,
        defaultCurrency: 'BRL',
        timezone: 'America/Sao_Paulo',
        accountsPayableRecurrenceHorizonMonths: 12,
      });
    }
    if (!settings.defaultFiscalProfileId) {
      settings.defaultFiscalProfileId = profile.id;
    }
    if (settings.defaultFiscalProfileId === profile.id) {
      settings.fiscalModuleEnabled = profile.fiscalMode !== 'INATIVO';
    }
    await repository.save(settings);
  }

  private normalizeFiscalMode(value: unknown) {
    const normalized = String(value || 'INATIVO')
      .trim()
      .toUpperCase();
    if (!FISCAL_MODES.has(normalized)) {
      throw new BadRequestException('Modo fiscal inválido.');
    }
    return normalized;
  }

  private normalizeEnvironment(value: unknown) {
    const normalized = String(value || 'HOMOLOG')
      .trim()
      .toUpperCase();
    if (!ENVIRONMENTS.has(normalized)) {
      throw new BadRequestException('Ambiente fiscal inválido.');
    }
    return normalized;
  }

  private requiredText(value: unknown, label: string) {
    const normalized = String(value || '').trim();
    if (!normalized) throw new BadRequestException(`${label} é obrigatório.`);
    return normalized;
  }

  private requiredCscId(value: unknown) {
    const normalized = this.requiredText(value, 'ID CSC');
    if (normalized.length > 20) {
      throw new BadRequestException('ID CSC deve ter no máximo 20 caracteres.');
    }
    if (!/^\d+$/.test(normalized)) {
      throw new BadRequestException('ID CSC deve conter apenas números.');
    }
    return normalized;
  }

  private optionalText(value: unknown) {
    const normalized = String(value ?? '').trim();
    return normalized.length ? normalized : null;
  }

  private onlyDigits(value: unknown, label: string) {
    const normalized = String(value || '').replace(/\D/g, '');
    if (!normalized) throw new BadRequestException(`${label} é obrigatório.`);
    return normalized;
  }

  private optionalDigits(value: unknown) {
    const normalized = String(value ?? '').replace(/\D/g, '');
    return normalized.length ? normalized : null;
  }

  private normalizeSearchText(value: unknown) {
    return String(value || '')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .trim()
      .toLowerCase();
  }

  private positiveInteger(value: unknown, fallback: number) {
    const parsed = Number(value ?? fallback);
    return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback;
  }

  private optionalDate(value: unknown) {
    if (!value) return null;
    const parsed = new Date(String(value));
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  }
}
