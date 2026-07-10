import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Commission } from './entities/commission.entity';
import { CommissionsController } from './commissions.controller';
import { CommissionsService } from './commissions.service';
import { CommissionsRepository } from './repositories/commissions.repository';
import { CommissionPayout } from './entities/commission-payout.entity';
import { CommissionPayoutItem } from './entities/commission-payout-item.entity';
import { AccountPayable } from '../accounts-payable/entities/account-payable.entity';
import { User } from '../users/entities/user.entity';
import { PaymentMethod } from '../payment-methods/entities/payment-method.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Commission,
      CommissionPayout,
      CommissionPayoutItem,
      AccountPayable,
      User,
      PaymentMethod,
    ]),
  ],
  controllers: [CommissionsController],
  providers: [CommissionsService, CommissionsRepository],
  exports: [CommissionsService, CommissionsRepository],
})
export class CommissionsModule {}
