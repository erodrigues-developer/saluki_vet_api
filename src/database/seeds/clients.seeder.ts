import { DataSource } from 'typeorm';
import { Seeder } from 'typeorm-extension';
import { Client } from '../../modules/clients/entities/client.entity';

export default class ClientsSeeder implements Seeder {
  public async run(dataSource: DataSource): Promise<void> {
    const repository = dataSource.getRepository(Client);

    const existing = await repository.count();
    if (existing > 0) {
      return;
    }

    const now = new Date();
    await repository.insert([
      {
        name: 'Maria Souza',
        document: '12345678900',
        phone: '+55 11 4002-8922',
        mobilePhone: '+55 11 98888-1111',
        email: 'maria.souza@email.com',
        city: 'São Paulo',
        state: 'SP',
        zipCode: '01310-000',
        isActive: true,
        createdAt: now,
        updatedAt: now,
      },
      {
        name: 'João Pereira',
        document: '00987654321',
        phone: '+55 21 3555-0000',
        mobilePhone: '+55 21 97777-2222',
        email: 'joao.pereira@email.com',
        city: 'Rio de Janeiro',
        state: 'RJ',
        zipCode: '20000-000',
        notes: 'Prefere atendimento pela manhã',
        isActive: true,
        createdAt: now,
        updatedAt: now,
      },
      {
        name: 'Ana Lima',
        document: '11122233344',
        phone: '+55 31 3222-3333',
        mobilePhone: '+55 31 96666-5555',
        email: 'ana.lima@email.com',
        city: 'Belo Horizonte',
        state: 'MG',
        zipCode: '30110-000',
        isActive: false,
        notes: 'Conta desativada temporariamente',
        createdAt: now,
        updatedAt: now,
      },
    ]);
  }
}
