import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { APP_FILTER, APP_INTERCEPTOR, APP_GUARD } from '@nestjs/core';
import { HttpExceptionFilter } from './modules/utils/exceptions/http.exception.filter';
import { SuccessLoggingInterceptor } from './modules/utils/interceptors/success.logging.interceptor';
import { AlsInterceptor } from './common/interceptors/als.interceptor';
import { AuditSubscriber } from './database/subscribers/audit.subscriber';
import { JwtAuthGuard } from './common/guards/jwt-auth.guard';
import { RolesGuard } from './common/guards/roles.guard';
import { LoggerModule } from './modules/logger/logger.module';
import { RedisModule } from './modules/redis/redis.module';
import { ScheduleModule } from '@nestjs/schedule';
import { SqsModule } from './modules/sqs/sqs.module';
import { S3Module } from './modules/s3/s3.module';
import { ClientsModule } from './modules/clients/clients.module';
import { SpeciesModule } from './modules/species/species.module';
import { BreedsModule } from './modules/breeds/breeds.module';
import { PetsModule } from './modules/pets/pets.module';
import { RolesModule } from './modules/roles/roles.module';
import { UsersModule } from './modules/users/users.module';
import { ClinicSettingsModule } from './modules/clinic-settings/clinic-settings.module';
import { AppointmentTypesModule } from './modules/appointment-types/appointment-types.module';
import { AppointmentStatusesModule } from './modules/appointment-statuses/appointment-statuses.module';
import { ProductCategoriesModule } from './modules/product-categories/product-categories.module';
import { ProductsModule } from './modules/products/products.module';
import { ProceduresModule } from './modules/procedures/procedures.module';
import { AuthModule } from './modules/auth/auth.module';
import { AppointmentsModule } from './modules/appointments/appointments.module';
import { ConsultationsModule } from './modules/consultations/consultations.module';
import { ConsultationProceduresModule } from './modules/consultation-procedures/consultation-procedures.module';
import { PaymentMethodsModule } from './modules/payment-methods/payment-methods.module';
import { SalesModule } from './modules/sales/sales.module';
import { SaleItemsModule } from './modules/sale-items/sale-items.module';
import { PaymentsModule } from './modules/payments/payments.module';
import { AccountsPayableModule } from './modules/accounts-payable/accounts-payable.module';
import { AccountsReceivableModule } from './modules/accounts-receivable/accounts-receivable.module';
import { CommissionsModule } from './modules/commissions/commissions.module';
import { AuditLogsModule } from './modules/audit-logs/audit-logs.module';
import { SuppliersModule } from './modules/suppliers/suppliers.module';
import { BoxesModule } from './modules/boxes/boxes.module';
import { InpatientRecordsModule } from './modules/inpatient-records/inpatient-records.module';
import { ClinicalParametersModule } from './modules/clinical-parameters/clinical-parameters.module';
import { TreatmentMapModule } from './modules/treatment-map/treatment-map.module';
import { PrescriptionsModule } from './modules/prescriptions/prescriptions.module';
import { ConsultationDictationsModule } from './modules/consultation-dictations/consultation-dictations.module';
import { AiConversationsModule } from './modules/ai-conversations/ai-conversations.module';
import { StockMovementsModule } from './modules/stock-movements/stock-movements.module';
import { StockLocationsModule } from './modules/stock-locations/stock-locations.module';
import { VeterinarianAvailabilityModule } from './modules/veterinarian-availability/veterinarian-availability.module';
import { ExamCategoriesModule } from './modules/exam-categories/exam-categories.module';
import { ExamTypesModule } from './modules/exam-types/exam-types.module';
import { ExamRequestsModule } from './modules/exam-requests/exam-requests.module';
import configuration from './configs/configuration';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => {
        return {
          type: 'postgres',
          host:
            configService.get<string>('DATABASE_HOST') ||
            'postgres_template_api',
          port: parseInt(configService.get<string>('DATABASE_PORT') || '5432'),
          username:
            configService.get<string>('DATABASE_USERNAME') || 'postgres',
          password:
            configService.get<string>('DATABASE_PASSWORD') || 'postgres',
          database: configService.get<string>('DATABASE_NAME') || 'template',
          synchronize: false,
          autoLoadEntities: true,
          subscribers: [AuditSubscriber],
          logging: process.env.DB_LOG == 'true' ? true : false,
        };
      },
      inject: [ConfigService],
    }),
    ScheduleModule.forRoot(),
    RedisModule,
    LoggerModule,
    SqsModule,
    S3Module,
    ClientsModule,
    SpeciesModule,
    BreedsModule,
    PetsModule,
    RolesModule,
    UsersModule,
    ClinicSettingsModule,
    AppointmentTypesModule,
    AppointmentStatusesModule,
    ProductCategoriesModule,
    ProductsModule,
    ProceduresModule,
    AppointmentsModule,
    ConsultationsModule,
    ConsultationProceduresModule,
    PaymentMethodsModule,
    SalesModule,
    SaleItemsModule,
    PaymentsModule,
    AuthModule,
    AccountsPayableModule,
    AccountsReceivableModule,
    CommissionsModule,
    AuditLogsModule,
    SuppliersModule,
    BoxesModule,
    InpatientRecordsModule,
    ClinicalParametersModule,
    TreatmentMapModule,
    PrescriptionsModule,
    ConsultationDictationsModule,
    AiConversationsModule,
    StockLocationsModule,
    StockMovementsModule,
    VeterinarianAvailabilityModule,
    ExamCategoriesModule,
    ExamTypesModule,
    ExamRequestsModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_FILTER,
      useClass: HttpExceptionFilter,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: SuccessLoggingInterceptor,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: AlsInterceptor,
    },
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
    {
      provide: APP_GUARD,
      useClass: RolesGuard,
    },
  ],
  exports: [TypeOrmModule],
})
export class AppModule {}
