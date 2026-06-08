import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { StockLocation } from './entities/stock-location.entity';
import { StockMovement } from '../stock-movements/entities/stock-movement.entity';

@Injectable()
export class StockLocationsService {
  constructor(
    @InjectRepository(StockLocation)
    private readonly stockLocationsRepository: Repository<StockLocation>,
    @InjectRepository(StockMovement)
    private readonly stockMovementsRepository: Repository<StockMovement>,
  ) {}

  async create(payload: any): Promise<StockLocation> {
    const name = this.normalizeName(payload?.name);
    if (!name) {
      throw new BadRequestException('Nome do local de estoque é obrigatório.');
    }

    await this.ensureUniqueName(name);
    await this.validateStateTransition({
      current: null,
      nextIsDefault: payload?.isDefault ?? false,
      nextIsActive: payload?.isActive ?? true,
    });

    const location = this.stockLocationsRepository.create({
      name,
      isDefault: Boolean(payload?.isDefault),
      isActive: payload?.isActive !== false,
    });

    const saved = await this.stockLocationsRepository.save(location);
    if (saved.isDefault) {
      await this.clearOtherDefaults(saved.id);
    }

    return this.findOne(saved.id);
  }

  async findAll(params: {
    page?: number;
    limit?: number;
    search?: string;
    isActive?: boolean | string;
  }) {
    const page = params.page && params.page > 0 ? Number(params.page) : 1;
    const limit = params.limit && params.limit > 0 ? Number(params.limit) : 10;

    const qb = this.stockLocationsRepository.createQueryBuilder('location');

    const isActive =
      params.isActive === true ||
      params.isActive === 'true' ||
      params.isActive === false ||
      params.isActive === 'false'
        ? params.isActive === true || params.isActive === 'true'
        : undefined;

    if (params.search) {
      qb.andWhere('LOWER(location.name) LIKE LOWER(:search)', {
        search: `%${String(params.search).trim()}%`,
      });
    }

    if (isActive !== undefined) {
      qb.andWhere('location.isActive = :isActive', { isActive });
    }

    qb.orderBy('location.isDefault', 'DESC')
      .addOrderBy('location.isActive', 'DESC')
      .addOrderBy('location.name', 'ASC')
      .skip((page - 1) * limit)
      .take(limit);

    const [data, total] = await qb.getManyAndCount();
    const summary = await this.buildSummary();

    return {
      data,
      meta: {
        page,
        limit,
        total,
        summary,
      },
    };
  }

  async findActiveOptions() {
    return this.stockLocationsRepository.find({
      where: { isActive: true },
      order: { isDefault: 'DESC', name: 'ASC' },
    });
  }

  async findOne(id: number): Promise<StockLocation> {
    const location = await this.stockLocationsRepository.findOne({
      where: { id },
    });
    if (!location) {
      throw new NotFoundException(`StockLocation ${id} not found`);
    }
    return location;
  }

  async update(id: number, payload: any): Promise<StockLocation> {
    const location = await this.findOne(id);
    const nextName =
      payload?.name !== undefined ? this.normalizeName(payload.name) : location.name;

    if (!nextName) {
      throw new BadRequestException('Nome do local de estoque é obrigatório.');
    }

    await this.ensureUniqueName(nextName, id);

    const nextIsDefault =
      payload?.isDefault !== undefined
        ? Boolean(payload.isDefault)
        : location.isDefault;
    const nextIsActive =
      payload?.isActive !== undefined ? Boolean(payload.isActive) : location.isActive;

    await this.validateStateTransition({
      current: location,
      nextIsDefault,
      nextIsActive,
    });

    const merged = this.stockLocationsRepository.merge(location, {
      name: nextName,
      isDefault: nextIsDefault,
      isActive: nextIsActive,
    });
    const saved = await this.stockLocationsRepository.save(merged);
    if (saved.isDefault) {
      await this.clearOtherDefaults(saved.id);
    }
    return this.findOne(saved.id);
  }

  async remove(id: number): Promise<void> {
    const location = await this.findOne(id);
    const movementCount = await this.stockMovementsRepository.count({
      where: { stockLocationId: location.id },
    });
    if (movementCount > 0) {
      throw new ConflictException(
        'Não é possível excluir local com movimentações vinculadas.',
      );
    }
    await this.stockLocationsRepository.remove(location);
  }

  private normalizeName(value: unknown) {
    return String(value || '').trim();
  }

  private async ensureUniqueName(name: string, ignoreId?: number) {
    const qb = this.stockLocationsRepository
      .createQueryBuilder('location')
      .where('LOWER(TRIM(location.name)) = LOWER(TRIM(:name))', { name });

    if (ignoreId) {
      qb.andWhere('location.id != :ignoreId', { ignoreId });
    }

    const existing = await qb.getOne();
    if (existing) {
      throw new ConflictException('Já existe um local de estoque com esse nome.');
    }
  }

  private async validateStateTransition(params: {
    current: StockLocation | null;
    nextIsDefault: boolean;
    nextIsActive: boolean;
  }) {
    if (params.nextIsDefault && !params.nextIsActive) {
      throw new BadRequestException(
        'Não é possível definir um local inativo como padrão.',
      );
    }

    if (params.current?.isDefault && !params.nextIsActive) {
      throw new BadRequestException(
        'Defina outro local padrão ativo antes de inativar este local.',
      );
    }

    if (!params.current && !params.nextIsDefault) {
      const defaultCount = await this.stockLocationsRepository.count({
        where: { isDefault: true, isActive: true },
      });
      if (defaultCount === 0) {
        throw new BadRequestException(
          'O primeiro local de estoque ativo deve ser definido como padrão.',
        );
      }
    }
  }

  private async clearOtherDefaults(currentId: number) {
    await this.stockLocationsRepository
      .createQueryBuilder()
      .update(StockLocation)
      .set({ isDefault: false })
      .where('id != :id', { id: currentId })
      .execute();
  }

  private async buildSummary() {
    const [total, active, defaults] = await Promise.all([
      this.stockLocationsRepository.count(),
      this.stockLocationsRepository.count({ where: { isActive: true } }),
      this.stockLocationsRepository.count({
        where: { isActive: true, isDefault: true },
      }),
    ]);

    return {
      total,
      active,
      inactive: total - active,
      defaults,
    };
  }
}
