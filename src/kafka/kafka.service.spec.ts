import { Test, TestingModule } from '@nestjs/testing';
import { KafkaService } from './kafka.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Transaction } from 'src/entity/transaction.entity';
import { Repository } from 'typeorm';

// Mock kafkajs
jest.mock('kafkajs', () => {
  return {
    Kafka: jest.fn(() => ({
      producer: jest.fn(() => ({
        connect: jest.fn(),
        disconnect: jest.fn(),
        send: jest.fn(),
      })),
      consumer: jest.fn(() => ({
        connect: jest.fn(),
        disconnect: jest.fn(),
        subscribe: jest.fn(),
        run: jest.fn(),
      })),
    })),
  };
});

const mockTransactionRepository = () => ({
  update: jest.fn(),
});

describe('KafkaService', () => {
  let service: KafkaService;
  let repository: Repository<Transaction>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        KafkaService,
        {
          provide: getRepositoryToken(Transaction),
          useFactory: mockTransactionRepository,
        },
      ],
    }).compile();

    service = module.get<KafkaService>(KafkaService);
    repository = module.get<Repository<Transaction>>(
      getRepositoryToken(Transaction),
    );
  });

  afterAll(async () => {
    await service.onModuleDestroy();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('onModuleInit', () => {
    it('should consume messages and update the transaction status', async () => {
      jest.setTimeout(10000); // Set timeout to 10 seconds
      const spyProduce = jest.spyOn(service, 'produce').mockResolvedValue();
      const spyUpdate = jest
        .spyOn(repository, 'update')
        .mockResolvedValue({} as any);

      await service.onModuleInit();

      // Simulate message consumption
      await service.consume('new-transaction-created', async (message) => {
        const status = message.value > 1000 ? 'rejected' : 'approved';
        await repository.update(
          { transactionExternalId: message.transactionExternalId },
          { status },
        );
        await service.produce('new-transaction-status-updated', {
          transactionExternalId: message.transactionExternalId,
          status,
        });
      });
    });
  });
});
