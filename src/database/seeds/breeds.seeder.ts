import { DataSource, In } from 'typeorm';
import { Seeder } from 'typeorm-extension';
import { Breed } from '../../modules/breeds/entities/breed.entity';
import { Species } from '../../modules/species/entities/species.entity';

export default class BreedsSeeder implements Seeder {
  public async run(dataSource: DataSource): Promise<void> {
    const breedRepository = dataSource.getRepository(Breed);
    const existing = await breedRepository.count();
    if (existing > 0) {
      return;
    }

    const speciesRepository = dataSource.getRepository(Species);
    const targetSpeciesNames = ['Cachorro', 'Gato', 'Coelho'];
    const now = new Date();

    const foundSpecies = await speciesRepository.find({
      where: { name: In(targetSpeciesNames) },
    });

    const missingNames = targetSpeciesNames.filter(
      (name) => !foundSpecies.some((s) => s.name === name),
    );

    if (missingNames.length > 0) {
      await speciesRepository.insert(
        missingNames.map((name) => ({
          name,
          createdAt: now,
          updatedAt: now,
        })),
      );
    }

    const speciesByName = await speciesRepository.find({
      where: { name: In(targetSpeciesNames) },
    });

    const getSpeciesId = (name: string) =>
      speciesByName.find((s) => s.name === name)?.id;

    await breedRepository.insert([
      {
        name: 'Vira-lata',
        speciesId: getSpeciesId('Cachorro')!,
        createdAt: now,
        updatedAt: now,
      },
      {
        name: 'Bulldog Francês',
        speciesId: getSpeciesId('Cachorro')!,
        createdAt: now,
        updatedAt: now,
      },
      {
        name: 'Siamês',
        speciesId: getSpeciesId('Gato')!,
        createdAt: now,
        updatedAt: now,
      },
      {
        name: 'Persa',
        speciesId: getSpeciesId('Gato')!,
        createdAt: now,
        updatedAt: now,
      },
      {
        name: 'Lionhead',
        speciesId: getSpeciesId('Coelho')!,
        createdAt: now,
        updatedAt: now,
      },
    ]);
  }
}
