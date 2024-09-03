import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TransactionModule } from './transaction/transaction.module';
import { KafkaModule } from './kafka/kafka.module';
import { Transaction } from './entity/transaction.entity';
import { ConfigModule } from '@nestjs/config';

//import { RedisModule } from './redis/redis.module';

@Module({
  imports: [
    ConfigModule.forRoot(),
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: 'localhost',
      port: 5432,
      username: process.env.POSTGRES_USER,
      password: process.env.POSTGRES_PASSWORD,
      database: 'postgres',
      entities: [Transaction],
      synchronize: true, // In production, set this to false and handle migrations
    }),
    TransactionModule,
    KafkaModule,
    // RedisModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
