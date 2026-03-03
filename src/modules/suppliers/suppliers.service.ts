import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { SuppliersRepository } from './repositories/suppliers.repository';
import { Supplier } from './entities/supplier.entity';
import { CreateSupplierDto } from './dto/create-supplier.dto';
import { UpdateSupplierDto } from './dto/update-supplier.dto';
import { FilterSuppliersDto } from './dto/filter-suppliers.dto';

@Injectable()
export class SuppliersService {
  constructor(private readonly suppliersRepository: SuppliersRepository) {}

  async create(payload: CreateSupplierDto): Promise<Supplier> {
    const normalizedDocument = this.normalizeDocument(payload.document);

    if (normalizedDocument) {
      await this.assertDocumentUniqueness(normalizedDocument);
    }

    const supplier = this.suppliersRepository.create({
      ...payload,
      document: normalizedDocument,
    });

    return this.suppliersRepository.save(supplier);
  }

  async findAll(filters: FilterSuppliersDto) {
    const page = filters.page ?? 1;
    const limit = filters.limit ?? 20;

    if (page < 1 || limit < 1) {
      throw new BadRequestException('page and limit must be greater than 0');
    }

    const { data, total } = await this.suppliersRepository.findPaginated({
      search: filters.search,
      isActive: filters.isActive,
      page,
      limit,
      sortBy:
        filters.sortBy === 'createdAt'
          ? 'created_at'
          : filters.sortBy === 'updatedAt'
            ? 'updated_at'
            : 'name',
      sortDirection:
        filters.sortDirection?.toLowerCase() === 'desc' ? 'DESC' : 'ASC',
    });

    return {
      data,
      meta: {
        total,
        page,
        limit,
      },
    };
  }

  async findOne(id: number): Promise<Supplier> {
    const supplier = await this.suppliersRepository.findOne({ where: { id } });

    if (!supplier) {
      throw new NotFoundException(`Supplier ${id} not found`);
    }

    return supplier;
  }

  async update(id: number, payload: UpdateSupplierDto): Promise<Supplier> {
    const supplier = await this.findOne(id);

    let normalizedDocument = supplier.document;

    if (payload.document !== undefined) {
      normalizedDocument = this.normalizeDocument(payload.document);
      if (normalizedDocument) {
        await this.assertDocumentUniqueness(normalizedDocument, id);
      }
    }

    const merged = this.suppliersRepository.merge(supplier, {
      ...payload,
      document: normalizedDocument,
    });

    return this.suppliersRepository.save(merged);
  }

  async remove(id: number): Promise<void> {
    const supplier = await this.findOne(id);

    if (!supplier.isActive) {
      return;
    }

    supplier.isActive = false;
    await this.suppliersRepository.save(supplier);
  }

  private normalizeDocument(document?: string | null): string | null {
    if (typeof document !== 'string') {
      return null;
    }

    const normalized = document.replace(/\D/g, '');

    return normalized.length > 0 ? normalized : null;
  }

  private async assertDocumentUniqueness(
    document: string,
    ignoreId?: number,
  ): Promise<void> {
    const existing = await this.suppliersRepository.findOneBy({ document });

    if (existing && Number(existing.id) !== ignoreId) {
      throw new BadRequestException('Document already in use by another supplier');
    }
  }
}
