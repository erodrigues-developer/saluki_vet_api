import { Injectable } from '@nestjs/common';
import { DataSource, Repository, FindOptionsWhere, ILike } from 'typeorm';
import { Procedure } from '../entities/procedure.entity';

@Injectable()
export class ProceduresRepository extends Repository<Procedure> {
  constructor(private readonly dataSource: DataSource) {
    super(Procedure, dataSource.createEntityManager());
  }

  async findPaginated(params: {
    page: number;
    limit: number;
    name?: string;
    isActive?: boolean;
    sortBy: string;
    sortDirection: 'ASC' | 'DESC';
  }): Promise<[Procedure[], number]> {
    const { page, limit, name, isActive, sortBy, sortDirection } = params;

    const where: FindOptionsWhere<Procedure> = {};
    if (name) {
      where.name = ILike(`%${name}%`);
    }
    if (isActive !== undefined && isActive !== null) {
      where.isActive = isActive;
    }

    return this.findAndCount({
      where,
      order: {
        [sortBy]: sortDirection,
        id: 'DESC',
      },
      skip: (page - 1) * limit,
      take: limit,
    });
  }
}
