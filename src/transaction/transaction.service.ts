import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { CreateTransactionDto } from 'src/common/dtos/create.transaction.dto';
import { Transaction } from 'src/entity/transaction.entity';
import { KafkaService } from 'src/kafka/kafka.service';
//import { KafkaService } from 'src/kafka/kafka.service';
import { Repository } from 'typeorm';

@Injectable()
export class TransactionService {
  constructor(
    @InjectRepository(Transaction)
    private readonly transactionRepository: Repository<Transaction>,
    private readonly kafkaService: KafkaService,
    // private readonly redisService: RedisService,
  ) {}

  async createTransaction(
    createTransactionDto: CreateTransactionDto,
  ): Promise<Transaction> {
    const transaction = this.transactionRepository.create({
      ...createTransactionDto,
      status: 'pending', // Default pending status for every transaction
    });

    // Save the transaction with a pending status on database
    const savedTransaction = await this.transactionRepository.save(transaction);

    // Emit event to kafka to create new transaction
    await this.kafkaService.produce('new-transaction-created', {
      transactionExternalId: savedTransaction.transactionExternalId,
      accountExternalIdDebit: savedTransaction.accountExternalIdDebit,
      accountExternalIdCredit: savedTransaction.accountExternalIdCredit,
      value: savedTransaction.value,
    });

    return savedTransaction;
  }

  async getTransaction(transactionExternalId: string): Promise<Transaction> {
    // const cachedTransaction = await this.redisService.get(
    //   transactionExternalId,
    // );
    // if (cachedTransaction) {
    //   return JSON.parse(cachedTransaction);
    // }

    const transaction = await this.transactionRepository.findOne({
      where: { transactionExternalId },
    });
    if (!transaction) {
      throw new Error('Transaction not found');
    }

    // await this.redisService.set(
    //   transactionExternalId,
    //   JSON.stringify(transaction),
    //   300,
    // );

    return transaction;
  }

  async updateTransactionStatus(
    transactionExternalId: string,
    status: 'approved' | 'rejected',
  ): Promise<void> {
    await this.transactionRepository.update(
      { transactionExternalId },
      { status },
    );
    await this.kafkaService.produce('new-transaction-status-updated', {
      transactionExternalId,
      status,
    });
  }
}
