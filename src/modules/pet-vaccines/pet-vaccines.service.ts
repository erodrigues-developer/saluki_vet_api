import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';

@Injectable()
export class PetVaccinesService {
  constructor(private readonly dataSource: DataSource) {}

  async getDueOverview(today: string, upcomingEnd: string) {
    const rows = await this.dataSource.query(
      `WITH latest AS (
         SELECT DISTINCT ON (pet_vaccine.pet_id, pet_vaccine.vaccine_id)
                pet_vaccine.id,
                pet_vaccine.due_date,
                pet.name AS "petName",
                vaccine.name AS "vaccineName"
           FROM pet_vaccines pet_vaccine
           JOIN pets pet ON pet.id = pet_vaccine.pet_id AND pet.deleted_at IS NULL
           JOIN vaccines vaccine ON vaccine.id = pet_vaccine.vaccine_id
          WHERE pet_vaccine.due_date IS NOT NULL
          ORDER BY pet_vaccine.pet_id, pet_vaccine.vaccine_id,
                   pet_vaccine.application_date DESC, pet_vaccine.id DESC
       )
       SELECT id::text, due_date::text AS "dueDate", "petName", "vaccineName"
         FROM latest
        WHERE due_date <= $1::date
        ORDER BY due_date ASC, "petName" ASC`,
      [upcomingEnd],
    );

    const overdue = rows.filter((row: any) => row.dueDate < today);
    const dueToday = rows.filter((row: any) => row.dueDate === today);
    const upcoming = rows.filter((row: any) => row.dueDate > today);

    return {
      today: dueToday.length,
      overdue: overdue.length,
      upcoming: upcoming.length,
      items: [...overdue, ...dueToday, ...upcoming].slice(0, 5).map((row: any) => ({
        id: Number(row.id),
        petName: row.petName,
        vaccineName: row.vaccineName,
        dueDate: row.dueDate,
      })),
    };
  }
}
