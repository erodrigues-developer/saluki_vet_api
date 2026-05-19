import { DataSource } from 'typeorm';
import { Seeder } from 'typeorm-extension';
import { Role } from '../../modules/roles/entities/role.entity';
import { User } from '../../modules/users/entities/user.entity';
import { ClinicSettings } from '../../modules/clinic-settings/entities/clinic-settings.entity';
import { AppointmentType } from '../../modules/appointment-types/entities/appointment-type.entity';
import { AppointmentStatus } from '../../modules/appointment-statuses/entities/appointment-status.entity';
import { ProductCategory } from '../../modules/product-categories/entities/product-category.entity';
import { Product } from '../../modules/products/entities/product.entity';
import { Procedure } from '../../modules/procedures/entities/procedure.entity';
import { PaymentMethod } from '../../modules/payment-methods/entities/payment-method.entity';
import { ExamType } from '../../modules/exam-types/entities/exam-type.entity';
import { Vaccine } from '../../modules/vaccines/entities/vaccine.entity';
import { Box } from '../../modules/boxes/entities/box.entity';
import { StockLocation } from '../../modules/stock-locations/entities/stock-location.entity';
import { StockMovement } from '../../modules/stock-movements/entities/stock-movement.entity';
import * as bcrypt from 'bcrypt';

export default class SystemSeeder implements Seeder {
  public async run(dataSource: DataSource): Promise<void> {
    console.log('--- Running SystemSeeder ---');
    const roleRepo = dataSource.getRepository(Role);
    const userRepo = dataSource.getRepository(User);
    const settingsRepo = dataSource.getRepository(ClinicSettings);
    const apptTypeRepo = dataSource.getRepository(AppointmentType);
    const apptStatusRepo = dataSource.getRepository(AppointmentStatus);
    const categoryRepo = dataSource.getRepository(ProductCategory);
    const productRepo = dataSource.getRepository(Product);
    const procedureRepo = dataSource.getRepository(Procedure);
    const paymentMethodRepo = dataSource.getRepository(PaymentMethod);
    const examTypeRepo = dataSource.getRepository(ExamType);
    const vaccineRepo = dataSource.getRepository(Vaccine);
    const boxRepo = dataSource.getRepository(Box);
    const stockLocationRepo = dataSource.getRepository(StockLocation);
    const stockMovementRepo = dataSource.getRepository(StockMovement);

    const now = new Date();

    // 1. Roles
    const adminRoleExists = await roleRepo.findOne({
      where: { name: 'Administrador' },
    });
    if (!adminRoleExists) {
      console.log('Seeding Roles...');
      await roleRepo.insert([
        {
          name: 'Administrador',
          code: 'ADMIN',
          createdAt: now,
          updatedAt: now,
        },
        { name: 'Veterinário', code: 'VET', createdAt: now, updatedAt: now },
        {
          name: 'Recepcionista',
          code: 'RECEPTIONIST',
          createdAt: now,
          updatedAt: now,
        },
      ]);
    } else {
      console.log('Roles already seeded.');
    }

    // 2. Admin User
    const adminUserExists = await userRepo.findOne({
      where: { email: 'admin@salukivet.com.br' },
    });
    if (!adminUserExists) {
      console.log('Seeding Admin User...');
      const adminRole = await roleRepo.findOne({
        where: { name: 'Administrador' },
      });
      const hashedPw = await bcrypt.hash('admin123', 10);
      if (adminRole) {
        const newUser = userRepo.create({
          name: 'Admin Saluki',
          email: 'admin@salukivet.com.br',
          passwordHash: hashedPw,
          roles: [adminRole],
          isActive: true,
          createdAt: now,
          updatedAt: now,
        });
        await userRepo.save(newUser);
      }
    } else {
      console.log('Admin User already exists.');
    }

    // 3. Clinic Settings
    if ((await settingsRepo.count()) === 0) {
      await settingsRepo.insert({
        appointmentSlotDurationMinutes: 30,
        defaultCurrency: 'BRL',
        timezone: 'America/Sao_Paulo',
        businessHoursJson:
          '{"seg": ["08:00-18:00"], "ter": ["08:00-18:00"], "qua": ["08:00-18:00"], "qui": ["08:00-18:00"], "sex": ["08:00-18:00"], "sab": ["08:00-12:00"]}',
        notes: 'Configuração Inicial Padrão',
        createdAt: now,
        updatedAt: now,
      });
    }

    // 4. Appointment Types
    if ((await apptTypeRepo.count()) === 0) {
      await apptTypeRepo.insert([
        {
          name: 'Consulta Geral',
          defaultDurationMinutes: 30,
          description: 'Consulta clínica básica',
          createdAt: now,
          updatedAt: now,
        },
        {
          name: 'Vacinação',
          defaultDurationMinutes: 15,
          description: 'Aplicação de vacinas',
          createdAt: now,
          updatedAt: now,
        },
        {
          name: 'Retorno',
          defaultDurationMinutes: 20,
          description: 'Retorno sem custo',
          createdAt: now,
          updatedAt: now,
        },
        {
          name: 'Exame',
          defaultDurationMinutes: 45,
          description: 'Coleta e exames gerais',
          createdAt: now,
          updatedAt: now,
        },
        {
          name: 'Cirurgia',
          defaultDurationMinutes: 120,
          description: 'Procedimento cirúrgico',
          createdAt: now,
          updatedAt: now,
        },
      ]);
    }

    // 5. Appointment Statuses
    if ((await apptStatusRepo.count()) === 0) {
      await apptStatusRepo.insert([
        {
          code: 'SCHEDULED',
          name: 'Agendado',
          isSystem: true,
          createdAt: now,
          updatedAt: now,
        },
        {
          code: 'CONFIRMED',
          name: 'Confirmado',
          isSystem: true,
          createdAt: now,
          updatedAt: now,
        },
        {
          code: 'IN_PROGRESS',
          name: 'Em Atendimento',
          isSystem: true,
          createdAt: now,
          updatedAt: now,
        },
        {
          code: 'COMPLETED',
          name: 'Finalizado',
          isSystem: true,
          createdAt: now,
          updatedAt: now,
        },
        {
          code: 'CANCELED',
          name: 'Cancelado',
          isSystem: true,
          createdAt: now,
          updatedAt: now,
        },
        {
          code: 'NOSHOW',
          name: 'Não Compareceu',
          isSystem: true,
          createdAt: now,
          updatedAt: now,
        },
      ]);
    }
    const arrivedStatus = await apptStatusRepo.findOne({
      where: { code: 'ARRIVED' },
    });
    if (!arrivedStatus) {
      await apptStatusRepo.insert({
        code: 'ARRIVED',
        name: 'Chegou',
        isSystem: true,
        createdAt: now,
        updatedAt: now,
      });
    }

    // 6. Product Categories
    if ((await categoryRepo.count()) === 0) {
      await categoryRepo.insert([
        {
          name: 'Medicamentos',
          description: 'Remédios e fármacos',
          createdAt: now,
          updatedAt: now,
        },
        {
          name: 'Vacinas',
          description: 'Imunizantes',
          createdAt: now,
          updatedAt: now,
        },
        {
          name: 'Rações',
          description: 'Alimentação pet',
          createdAt: now,
          updatedAt: now,
        },
        {
          name: 'Acessórios',
          description: 'Coleiras, brinquedos, etc',
          createdAt: now,
          updatedAt: now,
        },
      ]);
    }

    // 7. Products
    if ((await productRepo.count()) === 0) {
      const medCat = await categoryRepo.findOne({
        where: { name: 'Medicamentos' },
      });
      const vacCat = await categoryRepo.findOne({ where: { name: 'Vacinas' } });
      const racCat = await categoryRepo.findOne({ where: { name: 'Rações' } });

      const insertProducts = [];
      if (vacCat)
        insertProducts.push({
          name: 'Vacina V10 Importada',
          productCategoryId: vacCat.id,
          costPrice: 35.0,
          salePrice: 90.0,
          isService: false,
          trackStock: true,
          isVaccine: true,
          createdAt: now,
          updatedAt: now,
        });
      if (vacCat)
        insertProducts.push({
          name: 'Vacina Antirrábica',
          productCategoryId: vacCat.id,
          costPrice: 15.0,
          salePrice: 60.0,
          isService: false,
          trackStock: true,
          isVaccine: true,
          createdAt: now,
          updatedAt: now,
        });
      if (medCat)
        insertProducts.push({
          name: 'Bravecto 10-20kg',
          productCategoryId: medCat.id,
          costPrice: 150.0,
          salePrice: 220.0,
          isService: false,
          trackStock: true,
          createdAt: now,
          updatedAt: now,
        });
      if (medCat)
        insertProducts.push({
          name: 'Simparic 20-40kg',
          productCategoryId: medCat.id,
          costPrice: 130.0,
          salePrice: 195.0,
          isService: false,
          trackStock: true,
          createdAt: now,
          updatedAt: now,
        });
      if (racCat)
        insertProducts.push({
          name: 'Ração Premier Cães Adultos 15kg',
          productCategoryId: racCat.id,
          costPrice: 180.0,
          salePrice: 249.9,
          isService: false,
          trackStock: true,
          createdAt: now,
          updatedAt: now,
        });

      if (insertProducts.length > 0) await productRepo.insert(insertProducts);
    }

    // 8. Procedures
    if ((await procedureRepo.count()) === 0) {
      await procedureRepo.insert([
        {
          name: 'Consulta Clínica',
          description: 'Avaliação veterinária geral',
          defaultPrice: 120.0,
          createdAt: now,
          updatedAt: now,
        },
        {
          name: 'Aplicação de Vacina',
          description: 'Procedimento de imunização',
          defaultPrice: 30.0,
          createdAt: now,
          updatedAt: now,
        },
        {
          name: 'Microchipagem',
          description: 'Implante de microchip de identificação',
          defaultPrice: 150.0,
          createdAt: now,
          updatedAt: now,
        },
        {
          name: 'Exame de Sangue (Hemograma)',
          description: 'Coleta e análise',
          defaultPrice: 80.0,
          createdAt: now,
          updatedAt: now,
        },
        {
          name: 'Castração Macho Pequeno Porte',
          description: 'Cirurgia eletiva',
          defaultPrice: 450.0,
          createdAt: now,
          updatedAt: now,
        },
      ]);
    }

    // 9. Payment Methods
    if ((await paymentMethodRepo.count()) === 0) {
      await paymentMethodRepo.insert([
        {
          name: 'Dinheiro',
          code: 'CASH',
          isActive: true,
          createdAt: now,
          updatedAt: now,
        },
        {
          name: 'PIX',
          code: 'PIX',
          isActive: true,
          createdAt: now,
          updatedAt: now,
        },
        {
          name: 'Cartão de Crédito',
          code: 'CREDIT_CARD',
          isActive: true,
          createdAt: now,
          updatedAt: now,
        },
        {
          name: 'Cartão de Débito',
          code: 'DEBIT_CARD',
          isActive: true,
          createdAt: now,
          updatedAt: now,
        },
        {
          name: 'Transferência Bancária',
          code: 'BANK_TRANSFER',
          isActive: true,
          createdAt: now,
          updatedAt: now,
        },
      ]);
    }

    // 10. Exam Types
    if ((await examTypeRepo.count()) === 0) {
      console.log('Seeding Exam Types...');
      await examTypeRepo.insert([
        {
          name: 'Hemograma Completo',
          description:
            'Avaliação quantitativa e qualitativa das células sanguíneas',
          defaultPrice: 85.0,
          createdAt: now,
          updatedAt: now,
        },
        {
          name: 'Ultrassom Abdominal',
          description: 'Exame de imagem da região abdominal',
          defaultPrice: 150.0,
          createdAt: now,
          updatedAt: now,
        },
        {
          name: 'Raio-X (até 3 projeções)',
          description: 'Exame radiográfico padrão',
          defaultPrice: 130.0,
          createdAt: now,
          updatedAt: now,
        },
        {
          name: 'Perfil Renal',
          description: 'Avaliação da função renal (Ureia e Creatinina)',
          defaultPrice: 60.0,
          createdAt: now,
          updatedAt: now,
        },
      ]);
    }

    // 11. Vaccines
    if ((await vaccineRepo.count()) === 0) {
      console.log('Seeding Vaccines...');
      await vaccineRepo.insert([
        {
          name: 'Vacina V10 (Cães)',
          manufacturer: 'Zoetis',
          description:
            'Imuniza contra Cinomose, Parvovirose, Coronavirose, Adenovirose (tipos 1 e 2), Parainfluenza e Leptospirose (4 cepas).',
          defaultIntervalDays: 365,
          createdAt: now,
          updatedAt: now,
        },
        {
          name: 'Vacina Antirrábica',
          manufacturer: 'Zoetis',
          description: 'Prevenção contra a Raiva.',
          defaultIntervalDays: 365,
          createdAt: now,
          updatedAt: now,
        },
        {
          name: 'Vacina V4 (Gatos)',
          manufacturer: 'Merial',
          description:
            'Imuniza contra Rinotraqueíte, Calicivirose, Panleucopenia e Clamidiose.',
          defaultIntervalDays: 365,
          createdAt: now,
          updatedAt: now,
        },
        {
          name: 'Gripe Canina (Pneumodog)',
          manufacturer: 'Merial',
          description: 'Vacina contra a Tosse dos Canis.',
          defaultIntervalDays: 365,
          createdAt: now,
          updatedAt: now,
        },
      ]);
    }

    // 12. Boxes (Inpatient)
    if ((await boxRepo.count()) === 0) {
      console.log('Seeding Boxes...');
      await boxRepo.insert([
        {
          name: 'Gatil A',
          description: 'Internação Padrão Felinos',
          isActive: true,
          createdAt: now,
          updatedAt: now,
        },
        {
          name: 'Canil P1',
          description: 'Internação Cães Pequeno Porte',
          isActive: true,
          createdAt: now,
          updatedAt: now,
        },
        {
          name: 'Canil G1',
          description: 'Internação Cães Grande Porte',
          isActive: true,
          createdAt: now,
          updatedAt: now,
        },
        {
          name: 'Isolamento Infecto',
          description: 'Para doenças infectocontagiosas',
          isActive: true,
          createdAt: now,
          updatedAt: now,
        },
      ]);
    }

    // 13. Stock Locations
    if ((await stockLocationRepo.count()) === 0) {
      console.log('Seeding Stock Locations...');
      await stockLocationRepo.insert([
        {
          name: 'Estoque Principal',
          isDefault: true,
          createdAt: now,
          updatedAt: now,
        },
        {
          name: 'Armário Recepção (Vendas)',
          isDefault: false,
          createdAt: now,
          updatedAt: now,
        },
        {
          name: 'Consultório 1',
          isDefault: false,
          createdAt: now,
          updatedAt: now,
        },
        {
          name: 'Bloco Cirúrgico',
          isDefault: false,
          createdAt: now,
          updatedAt: now,
        },
      ]);
    }

    const defaultLocation = await stockLocationRepo.findOne({
      where: { isDefault: true },
    });
    if (defaultLocation && (await stockMovementRepo.count()) === 0) {
      const seededProducts = await productRepo.find({
        where: { trackStock: true },
      });
      const quantitiesByName = new Map([
        ['Vacina V10 Importada', 50],
        ['Vacina Antirrábica', 100],
        ['Bravecto 10-20kg', 20],
        ['Simparic 20-40kg', 25],
        ['Ração Premier Cães Adultos 15kg', 10],
      ]);
      await stockMovementRepo.insert(
        seededProducts.map((product) => ({
          productId: product.id,
          stockLocationId: defaultLocation.id,
          movementType: 'IN',
          quantity: quantitiesByName.get(product.name) ?? 10,
          unitCost: product.costPrice ?? null,
          occurredAt: now,
          referenceType: 'SEED',
          referenceId: product.id,
          notes: 'Estoque inicial do seed',
          createdAt: now,
          updatedAt: now,
        })),
      );
    }
  }
}
