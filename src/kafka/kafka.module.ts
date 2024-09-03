import { Module } from '@nestjs/common';
import { KafkaService } from './kafka.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Transaction } from 'src/entity/transaction.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Transaction])],
  providers: [KafkaService],
  exports: [KafkaService],
})
export class KafkaModule {}
