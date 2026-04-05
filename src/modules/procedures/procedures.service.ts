import { Injectable, NotFoundException } from '@nestjs/common';
import { ProceduresRepository } from './repositories/procedures.repository';
import { Procedure } from './entities/procedure.entity';
import { CreateProcedureDto } from './dto/create-procedure.dto';
import { UpdateProcedureDto } from './dto/update-procedure.dto';

@Injectable()
export class ProceduresService {
  constructor(private readonly proceduresRepository: ProceduresRepository) {}

  async create(payload: CreateProcedureDto): Promise<Procedure> {
    const procedure = this.proceduresRepository.create({
      ...payload,
      commissionPercent:
        payload.commissionPercent !== undefined
          ? payload.commissionPercent
          : 0,
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
    const merged = this.proceduresRepository.merge(procedure, payload);
    return this.proceduresRepository.save(merged);
  }

  async remove(id: number): Promise<void> {
    const procedure = await this.findOne(id);
    await this.proceduresRepository.remove(procedure);
  }
}
