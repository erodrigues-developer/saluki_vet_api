import { DataSource } from 'typeorm';
import { Seeder } from 'typeorm-extension';
import { Species } from '../../modules/species/entities/species.entity';

export default class SpeciesSeeder implements Seeder {
  public async run(dataSource: DataSource): Promise<void> {
    const repository = dataSource.getRepository(Species);

    const existing = await repository.count();
    if (existing > 0) {
      return;
    }

    const now = new Date();
    await repository.insert([
      {
        name: 'Cachorro',
      },
      {
        name: 'Gato',
      },
      {
        name: 'Coelho',
      },
      {
        name: 'Hamster',
      },
      {
        name: 'Porquinho-da-Índia',
      },
      {
        name: 'Chinchila',
      },
      {
        name: 'Furão',
      },
      {
        name: 'Rato',
      },
      {
        name: 'Camundongo',
      },
      {
        name: 'Ave',
      },
      {
        name: 'Papagaio',
      },
      {
        name: 'Calopsita',
      },
      {
        name: 'Periquito',
      },
      {
        name: 'Canário',
      },
      {
        name: 'Tartaruga',
      },
      {
        name: 'Cobra',
      },
      {
        name: 'Lagarto',
      },
      {
        name: 'Iguana',
      },
      {
        name: 'Gecko',
      },
      {
        name: 'Sapo',
      },
      {
        name: 'Rã',
      },
      {
        name: 'Peixe',
      },
      {
        name: 'Bovino',
      },
      {
        name: 'Equino',
      },
      {
        name: 'Suíno',
      },
      {
        name: 'Caprino',
      },
      {
        name: 'Ovino',
      },
      {
        name: 'Galinha',
      },
    ]);
  }
}
