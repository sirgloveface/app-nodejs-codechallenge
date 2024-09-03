import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Transaction } from 'src/entity/transaction.entity';
import { KafkaModule } from 'src/kafka/kafka.module';
import { TransactionController } from './transaction.controller';
import { TransactionService } from './transaction.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([Transaction]),
    KafkaModule /*, RedisModule*/,
  ],
  controllers: [TransactionController],
  providers: [TransactionService],
})
export class TransactionModule {}
