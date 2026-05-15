import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ProceduresRepository } from './repositories/procedures.repository';
import { Procedure } from './entities/procedure.entity';
import { CreateProcedureDto } from './dto/create-procedure.dto';
import { UpdateProcedureDto } from './dto/update-procedure.dto';
import { ProductsService } from '../products/products.service';

@Injectable()
export class ProceduresService {
  constructor(
    private readonly proceduresRepository: ProceduresRepository,
    private readonly productsService: ProductsService,
  ) {}

  async create(payload: CreateProcedureDto): Promise<Procedure> {
    await this.ensureActiveNameIsUnique(payload.name, undefined, payload.isActive);
    await this.validateConsumption(payload);
    const procedure = this.proceduresRepository.create({
      ...payload,
      commissionPercent:
        payload.commissionPercent !== undefined ? payload.commissionPercent : 0,
    });
    return this.proceduresRepository.save(procedure);
  }

  async findAll(params: {
    page?: number;
    limit?: number;
    name?: string;
    isActive?: boolean | string;
    sortBy?: string;
    sortDirection?: 'asc' | 'desc';
  }) {
    const page = params.page && params.page > 0 ? Number(params.page) : 1;
    const limit = params.limit && params.limit > 0 ? Number(params.limit) : 10;
    const sortBy = params.sortBy || 'name';
    const sortDirection =
      params.sortDirection?.toUpperCase() === 'DESC' ? 'DESC' : 'ASC';

    let parsedIsActive: boolean | undefined = undefined;
    if (params.isActive !== undefined && params.isActive !== null) {
      parsedIsActive = params.isActive === 'true' || params.isActive === true;
    }

    const [data, total] = await this.proceduresRepository.findPaginated({
      page,
      limit,
      name: params.name,
      isActive: parsedIsActive,
      sortBy,
      sortDirection,
    });

    return {
      data,
      meta: {
        page,
        limit,
        total,
      },
    };
  }

  async findOne(id: number): Promise<Procedure> {
    const procedure = await this.proceduresRepository.findOne({
      where: { id },
    });
    if (!procedure) {
      throw new NotFoundException(`Procedure ${id} not found`);
    }
    return procedure;
  }

  async update(id: number, payload: UpdateProcedureDto): Promise<Procedure> {
    const procedure = await this.findOne(id);
    await this.ensureActiveNameIsUnique(
      payload.name ?? procedure.name,
      id,
      payload.isActive ?? procedure.isActive,
    );
    await this.validateConsumption(payload);
    const merged = this.proceduresRepository.merge(procedure, payload);
    return this.proceduresRepository.save(merged);
  }

  async remove(id: number): Promise<void> {
    const procedure = await this.findOne(id);
    await this.ensureNoLinkedHistory(procedure.id);
    await this.proceduresRepository.remove(procedure);
  }

  private async ensureActiveNameIsUnique(
    name: string,
    ignoreId?: number,
    isActive?: boolean,
  ) {
    if (!name?.trim() || isActive === false) return;

    const qb = this.proceduresRepository
      .createQueryBuilder('procedure')
      .where('LOWER(procedure.name) = LOWER(:name)', { name: name.trim() })
      .andWhere('procedure.is_active = :isActive', { isActive: true });

    if (ignoreId) {
      qb.andWhere('procedure.id != :id', { id: ignoreId });
    }

    const existing = await qb.getOne();
    if (existing) {
      throw new ConflictException(
        'Já existe um procedimento ativo com esse nome.',
      );
    }
  }

  private async ensureNoLinkedHistory(procedureId: number) {
    const [saleItems, commissions, consultationProcedures, treatmentMap] =
      await Promise.all([
        this.proceduresRepository.manager
          .createQueryBuilder()
          .from('sale_items', 'sale_items')
          .where('sale_items.procedure_id = :procedureId', { procedureId })
          .getCount(),
        this.proceduresRepository.manager
          .createQueryBuilder()
          .from('commissions', 'commissions')
          .where('commissions.procedure_id = :procedureId', { procedureId })
          .getCount(),
        this.proceduresRepository.manager
          .createQueryBuilder()
          .from('consultation_procedures', 'consultation_procedures')
          .where('consultation_procedures.procedure_id = :procedureId', {
            procedureId,
          })
          .getCount(),
        this.proceduresRepository.manager
          .createQueryBuilder()
          .from('treatment_map', 'treatment_map')
          .where('treatment_map.procedure_id = :procedureId', { procedureId })
          .getCount(),
      ]);

    if (saleItems || commissions || consultationProcedures || treatmentMap) {
      throw new ConflictException(
        'Não é possível excluir procedimentos com histórico vinculado. Você pode inativá-lo para impedir novos lançamentos.',
      );
    }
  }

  private async validateConsumption(
    payload: Pick<
      CreateProcedureDto,
      'consumedProductId' | 'consumptionQuantity'
    >,
  ) {
    if (!payload.consumedProductId) {
      return;
    }

    const quantity = Number(payload.consumptionQuantity || 0);
    if (quantity <= 0) {
      throw new BadRequestException(
        'Quantidade de consumo deve ser maior que zero.',
      );
    }

    const product = await this.productsService.findOne(
      payload.consumedProductId,
    );
    if (product.isService || !product.trackStock) {
      throw new BadRequestException(
        'Produto consumido deve ser um item fisico com estoque controlado.',
      );
    }
  }
}
