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
import { ExamCategory } from '../../modules/exam-categories/entities/exam-category.entity';
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
    const examCategoryRepo = dataSource.getRepository(ExamCategory);
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
        checkInToleranceMinutes: 10,
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
          barcode: '7891000000001',
          imgUrl: 'https://placehold.co/600x600?text=Vacina+V10',
          costPrice: 35.0,
          minimumStock: 10,
          salePrice: 90.0,
          isService: false,
          trackStock: true,
          isVaccine: true,
          unit: 'dose',
          createdAt: now,
          updatedAt: now,
        });
      if (vacCat)
        insertProducts.push({
          name: 'Vacina Antirrábica',
          productCategoryId: vacCat.id,
          barcode: '7891000000002',
          imgUrl: 'https://placehold.co/600x600?text=Antirrabica',
          costPrice: 15.0,
          minimumStock: 15,
          salePrice: 60.0,
          isService: false,
          trackStock: true,
          isVaccine: true,
          unit: 'dose',
          createdAt: now,
          updatedAt: now,
        });
      if (medCat)
        insertProducts.push({
          name: 'Bravecto 10-20kg',
          productCategoryId: medCat.id,
          barcode: '7891000000003',
          imgUrl: 'https://placehold.co/600x600?text=Bravecto',
          costPrice: 150.0,
          minimumStock: 5,
          salePrice: 220.0,
          isService: false,
          trackStock: true,
          unit: 'un',
          createdAt: now,
          updatedAt: now,
        });
      if (medCat)
        insertProducts.push({
          name: 'Simparic 20-40kg',
          productCategoryId: medCat.id,
          barcode: '7891000000004',
          imgUrl: 'https://placehold.co/600x600?text=Simparic',
          costPrice: 130.0,
          minimumStock: 5,
          salePrice: 195.0,
          isService: false,
          trackStock: true,
          unit: 'un',
          createdAt: now,
          updatedAt: now,
        });
      if (racCat)
        insertProducts.push({
          name: 'Ração Premier Cães Adultos 15kg',
          productCategoryId: racCat.id,
          barcode: '7891000000005',
          imgUrl: 'https://placehold.co/600x600?text=Racao+Premier',
          costPrice: 180.0,
          minimumStock: 3,
          salePrice: 249.9,
          isService: false,
          trackStock: true,
          unit: 'saco',
          createdAt: now,
          updatedAt: now,
        });

      if (insertProducts.length > 0) await productRepo.insert(insertProducts);
    }

    const serviceSeeds = [
      {
        name: 'Banho',
        salePrice: 70,
        costPrice: null,
        durationMinutes: 60,
        notes: 'Serviço de banho e secagem',
      },
      {
        name: 'Tosa Higiênica',
        salePrice: 55,
        costPrice: null,
        durationMinutes: 45,
        notes: 'Tosa em áreas higiênicas',
      },
      {
        name: 'Tosa Completa',
        salePrice: 120,
        costPrice: null,
        durationMinutes: 90,
        notes: 'Tosa completa conforme padrão da raça',
      },
      {
        name: 'Corte de Unhas',
        salePrice: 25,
        costPrice: null,
        durationMinutes: 15,
        notes: 'Corte e acabamento de unhas',
      },
      {
        name: 'Limpeza de Ouvidos',
        salePrice: 35,
        costPrice: null,
        durationMinutes: 20,
        notes: 'Higienização e limpeza de ouvidos',
      },
    ];

    const existingServices = await productRepo.find({
      where: serviceSeeds.map((service) => ({ name: service.name })),
      select: ['name'],
    });
    const existingServiceNames = new Set(existingServices.map((item) => item.name));
    const missingServices = serviceSeeds
      .filter((service) => !existingServiceNames.has(service.name))
      .map((service) => ({
        ...service,
        sku: null,
        imgUrl: null,
        isService: true,
        trackStock: false,
        isVaccine: false,
        isActive: true,
        productCategoryId: null,
        unit: null,
        createdAt: now,
        updatedAt: now,
      }));

    if (missingServices.length > 0) {
      await productRepo.insert(missingServices);
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

    // 10. Exam Categories
    const examCategorySeeds = [
      'Laboratorial',
      'Imagem',
      'Cardiológico',
      'Oftalmológico',
      'Dermatológico',
      'Infectocontagioso',
      'Endócrino',
      'Urina e fezes',
      'Outros',
    ];

    const existingExamCategories = await examCategoryRepo.find({
      where: examCategorySeeds.map((name) => ({ name })),
    });
    const existingExamCategoryNames = new Set(
      existingExamCategories.map((item) => item.name),
    );
    const missingExamCategories = examCategorySeeds
      .filter((name) => !existingExamCategoryNames.has(name))
      .map((name) => ({
        name,
        isActive: true,
        createdAt: now,
        updatedAt: now,
      }));

    if (missingExamCategories.length > 0) {
      console.log('Seeding Exam Categories...');
      await examCategoryRepo.insert(missingExamCategories);
    }

    const examCategories = await examCategoryRepo.find({
      where: examCategorySeeds.map((name) => ({ name })),
    });
    const examCategoryByName = new Map(
      examCategories.map((category) => [category.name, category]),
    );

    // 11. Exam Types
    const examTypeSeeds = [
      {
        name: 'Hemograma completo',
        category: 'Laboratorial',
        description:
          'Avaliação quantitativa e qualitativa das células sanguíneas',
        defaultPrice: 85.0,
      },
      {
        name: 'Bioquímica sérica',
        category: 'Laboratorial',
      },
      {
        name: 'Ureia',
        category: 'Laboratorial',
      },
      {
        name: 'Creatinina',
        category: 'Laboratorial',
      },
      {
        name: 'ALT/TGP',
        category: 'Laboratorial',
      },
      {
        name: 'AST/TGO',
        category: 'Laboratorial',
      },
      {
        name: 'Glicemia',
        category: 'Endócrino',
      },
      {
        name: 'Urinálise',
        category: 'Urina e fezes',
      },
      {
        name: 'Parasitológico de fezes',
        category: 'Urina e fezes',
      },
      {
        name: 'Ultrassonografia abdominal',
        category: 'Imagem',
        description: 'Exame de imagem da região abdominal',
        defaultPrice: 150.0,
      },
      {
        name: 'Radiografia',
        category: 'Imagem',
        description: 'Exame radiográfico padrão',
        defaultPrice: 130.0,
      },
      {
        name: 'Teste rápido para cinomose',
        category: 'Infectocontagioso',
      },
      {
        name: 'Teste para leishmaniose',
        category: 'Infectocontagioso',
      },
      {
        name: 'PCR',
        category: 'Infectocontagioso',
      },
    ];

    const legacyExamTypeRenameMap: Record<string, string> = {
      'Hemograma Completo': 'Hemograma completo',
      'Ultrassom Abdominal': 'Ultrassonografia abdominal',
      'Raio-X (até 3 projeções)': 'Radiografia',
    };
    const legacyExamTypes = await examTypeRepo.find({
      where: Object.keys(legacyExamTypeRenameMap).map((name) => ({ name })),
    });
    for (const legacyExamType of legacyExamTypes) {
      const targetName = legacyExamTypeRenameMap[legacyExamType.name];
      if (!targetName) continue;
      const targetExists = await examTypeRepo
        .createQueryBuilder('examType')
        .where('LOWER(TRIM(examType.name)) = LOWER(TRIM(:name))', {
          name: targetName,
        })
        .getOne();
      if (!targetExists) {
        await examTypeRepo.update(legacyExamType.id, {
          name: targetName,
          updatedAt: now,
        });
      }
    }

    const normalizedExamTypeNames = examTypeSeeds.map((item) =>
      item.name.trim().toLowerCase(),
    );
    const existingExamTypes = await examTypeRepo
      .createQueryBuilder('examType')
      .where('LOWER(TRIM(examType.name)) IN (:...names)', {
        names: normalizedExamTypeNames,
      })
      .getMany();
    const existingExamTypeNames = new Set(
      existingExamTypes.map((item) => item.name.trim().toLowerCase()),
    );
    const missingExamTypes = examTypeSeeds
      .filter((item) => !existingExamTypeNames.has(item.name.trim().toLowerCase()))
      .map((item) => ({
        name: item.name,
        description: item.description ?? null,
        defaultPrice: item.defaultPrice ?? null,
        examCategoryId: examCategoryByName.get(item.category)?.id ?? null,
        createdAt: now,
        updatedAt: now,
      }));

    if (missingExamTypes.length > 0) {
      console.log('Seeding Exam Types...');
      await examTypeRepo.insert(missingExamTypes);
    }

    const examTypeCategoryMap: Record<string, string> = {
      'Hemograma completo': 'Laboratorial',
      'Bioquímica sérica': 'Laboratorial',
      Ureia: 'Laboratorial',
      Creatinina: 'Laboratorial',
      'ALT/TGP': 'Laboratorial',
      'AST/TGO': 'Laboratorial',
      Glicemia: 'Endócrino',
      Urinálise: 'Urina e fezes',
      'Parasitológico de fezes': 'Urina e fezes',
      'Ultrassonografia abdominal': 'Imagem',
      Radiografia: 'Imagem',
      'Teste rápido para cinomose': 'Infectocontagioso',
      'Teste para leishmaniose': 'Infectocontagioso',
      PCR: 'Infectocontagioso',
    };
    const examTypesToRelate = await examTypeRepo.find({
      where: Object.keys(examTypeCategoryMap).map((name) => ({ name })),
    });
    for (const examType of examTypesToRelate) {
      const desiredCategoryName = examTypeCategoryMap[examType.name];
      const desiredCategoryId =
        examCategoryByName.get(desiredCategoryName)?.id ?? null;
      if (desiredCategoryId && examType.examCategoryId !== desiredCategoryId) {
        await examTypeRepo.update(examType.id, {
          examCategoryId: desiredCategoryId,
          updatedAt: now,
        });
      }
    }

    // 12. Vaccines
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

    // 13. Boxes (Inpatient)
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
          name: 'Sala de Vacinas',
          isDefault: false,
          createdAt: now,
          updatedAt: now,
        },
        {
          name: 'Farmácia',
          isDefault: false,
          createdAt: now,
          updatedAt: now,
        },
        {
          name: 'Internação',
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
