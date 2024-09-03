import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { Kafka, Producer, Consumer } from 'kafkajs';
import { InjectRepository } from '@nestjs/typeorm';
import { Transaction } from 'src/entity/transaction.entity';
import { Repository } from 'typeorm';

@Injectable()
export class KafkaService implements OnModuleInit, OnModuleDestroy {
  private readonly kafka = new Kafka({
    brokers: ['localhost:9092'],
  });
  private readonly producer: Producer = this.kafka.producer();
  private readonly consumer: Consumer = this.kafka.consumer({
    groupId: 'fraud-validator',
  });

  constructor(
    @InjectRepository(Transaction)
    private readonly transactionRepository: Repository<Transaction>,
  ) {}

  async onModuleInit() {
    await this.producer.connect();
    await this.consumer.connect();

    // Consume the 'new-transaction-created' topic
    await this.consume('new-transaction-created', async (transaction) => {
      // Declare and Validate the transaction amount no bigger than 1000
      const status: 'approved' | 'rejected' =
        transaction.value > 1000 ? 'rejected' : 'approved';

      // Update the transaction status in the database
      await this.transactionRepository.update(
        { transactionExternalId: transaction.transactionExternalId },
        { status },
      );

      // Send the updated status to the 'new-transaction-status-updated' topic
      await this.produce('new-transaction-status-updated', {
        transactionExternalId: transaction.transactionExternalId,
        status,
      });
    });
  }

  async onModuleDestroy() {
    await this.producer.disconnect();
    await this.consumer.disconnect();
  }

  async produce(topic: string, message: any): Promise<void> {
    await this.producer.send({
      topic,
      messages: [
        {
          value: JSON.stringify(message),
        },
      ],
    });
  }

  async consume(
    topic: string,
    eachMessageCallback: (message: any) => Promise<void>,
  ): Promise<void> {
    await this.consumer.subscribe({ topic, fromBeginning: false });

    await this.consumer.run({
      eachMessage: async ({ message }) => {
        const parsedMessage = JSON.parse(message.value.toString());
        await eachMessageCallback(parsedMessage);
      },
    });
  }
}
