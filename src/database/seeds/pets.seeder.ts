import { DataSource } from 'typeorm';
import { Seeder } from 'typeorm-extension';
import { Client } from '../../modules/clients/entities/client.entity';
import { Pet } from '../../modules/pets/entities/pet.entity';
import { Species } from '../../modules/species/entities/species.entity';
import { Breed } from '../../modules/breeds/entities/breed.entity';

export default class PetsSeeder implements Seeder {
  public async run(dataSource: DataSource): Promise<void> {
    const petRepo = dataSource.getRepository(Pet);

    const existing = await petRepo.count();
    if (existing > 0) {
      console.log('Pets already seeded.');
      return;
    }
    console.log('Seeding Pets...');

    const clientRepo = dataSource.getRepository(Client);
    const speciesRepo = dataSource.getRepository(Species);
    const breedRepo = dataSource.getRepository(Breed);

    const clients = await clientRepo.find();
    if (clients.length === 0) return; // Depends on ClientsSeeder

    const dogSpecies = await speciesRepo.findOne({
      where: { name: 'Cachorro' },
    });
    const catSpecies = await speciesRepo.findOne({ where: { name: 'Gato' } });

    const viraLata = dogSpecies
      ? await breedRepo.findOne({
          where: { name: 'Vira-lata', speciesId: dogSpecies.id },
        })
      : null;
    const siames = catSpecies
      ? await breedRepo.findOne({
          where: { name: 'Siamês', speciesId: catSpecies.id },
        })
      : null;

    const now = new Date();
    const insertPets = [];

    if (clients[0] && dogSpecies) {
      insertPets.push({
        name: 'Rex',
        clientId: clients[0].id,
        speciesId: dogSpecies.id,
        breedId: viraLata ? viraLata.id : null,
        sex: 'M',
        birthDate: new Date('2020-05-10'),
        color: 'Caramelo',
        weight: '15.5',
        createdAt: now,
        updatedAt: now,
      });
    }

    if (clients[1] && catSpecies) {
      insertPets.push({
        name: 'Mia',
        clientId: clients[1].id,
        speciesId: catSpecies.id,
        breedId: siames ? siames.id : null,
        sex: 'F',
        birthDate: new Date('2022-02-15'),
        color: 'Siamês',
        weight: '4.2',
        createdAt: now,
        updatedAt: now,
      });
    }

    if (insertPets.length > 0) {
      await petRepo.insert(insertPets);
    }
  }
}
