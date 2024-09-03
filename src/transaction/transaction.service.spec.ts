import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ConfigService } from '@nestjs/config';
import { TransactionService } from './transaction.service';
import { Transaction } from 'src/entity/transaction.entity';
import { KafkaService } from 'src/kafka/kafka.service';
import { Repository } from 'typeorm';
import { CreateTransactionDto } from 'src/common/dtos/create.transaction.dto';

//import { RedisService } from 'src/redis/redis.service';

const mockTransactionRepository = () => ({
  create: jest.fn().mockReturnThis(),
  save: jest.fn(),
  findOne: jest.fn(),
  update: jest.fn(),
});

const mockKafkaService = () => ({
  produce: jest.fn(),
});

describe('TransactionService', () => {
  let service: TransactionService;
  let repository: Repository<Transaction>;
  let kafkaService: KafkaService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TransactionService,
        ConfigService,
        {
          provide: getRepositoryToken(Transaction),
          useFactory: mockTransactionRepository,
        },
        {
          provide: KafkaService,
          useFactory: mockKafkaService,
        },
        // {
        //   provide: RedisService,
        //   useFactory: mockRedisService,
        // },
      ],
    }).compile();

    service = module.get<TransactionService>(TransactionService);

    repository = module.get<Repository<Transaction>>(
      getRepositoryToken(Transaction),
    );
    kafkaService = module.get<KafkaService>(KafkaService);
  });

  describe('it should be defined', () => {
    it('it should be defind', () => {
      expect(service).toBeDefined();
    });
  });

  describe('createTransaction', () => {
    it('should create a transaction and produce a Kafka event', async () => {
      const createTransactionDto: CreateTransactionDto = {
        accountExternalIdDebit: '550e8400-e29b-41d4-a716-446655440000',
        accountExternalIdCredit: '550e8400-e29b-41d4-a716-446655440001',
        tranferTypeId: 1,
        value: 120,
      };

      const savedTransaction = {
        ...createTransactionDto,
        transactionExternalId: '550e8400-e29b-41d4-a716-446655440002',
        status: 'pending',
      };

      // Mocks
      (repository.create as jest.Mock).mockReturnValue(savedTransaction);
      (repository.save as jest.Mock).mockResolvedValue(savedTransaction);

      const result = await service.createTransaction(createTransactionDto);

      expect(repository.create).toHaveBeenCalledWith({
        ...createTransactionDto,
        status: 'pending',
      });
      expect(repository.save).toHaveBeenCalledWith(savedTransaction);
      expect(kafkaService.produce).toHaveBeenCalledWith(
        'new-transaction-created',
        {
          transactionExternalId: savedTransaction.transactionExternalId,
          accountExternalIdDebit: savedTransaction.accountExternalIdDebit,
          accountExternalIdCredit: savedTransaction.accountExternalIdCredit,
          value: savedTransaction.value,
        },
      );
      expect(result).toEqual(savedTransaction);
    });
  });

  describe('getTransaction', () => {
    it('should return a transaction if found', async () => {
      const transactionExternalId = '550e8400-e29b-41d4-a716-446655440002';
      const transaction = {
        transactionExternalId,
        accountExternalIdDebit: '550e8400-e29b-41d4-a716-446655440000',
        accountExternalIdCredit: '550e8400-e29b-41d4-a716-446655440001',
        value: 120,
        status: 'pending',
      };
      // Mocks
      (repository.findOne as jest.Mock).mockReturnValue(transaction);
      const result = await service.getTransaction(transactionExternalId);

      expect(repository.findOne).toHaveBeenCalledWith({
        where: { transactionExternalId },
      });
      expect(result).toEqual(transaction);
    });

    it('should throw an error if transaction not found', async () => {
      const transactionExternalId = '550e8400-e29b-41d4-a716-446655440002';
      (repository.findOne as jest.Mock).mockResolvedValue(null);

      await expect(
        service.getTransaction(transactionExternalId),
      ).rejects.toThrow('Transaction not found');
    });
  });

  describe('updateTransactionStatus', () => {
    it('should update a transaction status and produce a Kafka event', async () => {
      const transactionExternalId = '550e8400-e29b-41d4-a716-446655440002';
      const status = 'approved';

      await service.updateTransactionStatus(transactionExternalId, status);

      expect(repository.update).toHaveBeenCalledWith(
        { transactionExternalId },
        { status },
      );
      expect(kafkaService.produce).toHaveBeenCalledWith(
        'new-transaction-status-updated',
        { transactionExternalId, status },
      );
    });
  });
});
