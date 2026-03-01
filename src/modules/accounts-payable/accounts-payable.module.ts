import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AccountsPayableService } from './accounts-payable.service';
import { AccountsPayableController } from './accounts-payable.controller';
import { AccountPayable } from './entities/account-payable.entity';

@Module({
  imports: [TypeOrmModule.forFeature([AccountPayable])],
  controllers: [AccountsPayableController],
  providers: [AccountsPayableService],
})
export class AccountsPayableModule {}
