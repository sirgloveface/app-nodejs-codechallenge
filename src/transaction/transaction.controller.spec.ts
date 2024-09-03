import { Test, TestingModule } from '@nestjs/testing';
import { TransactionController } from './transaction.controller';
import { TransactionService } from './transaction.service';
import { CreateTransactionDto } from 'src/common/dtos/create.transaction.dto';
import { Transaction } from 'src/entity/transaction.entity';

const mockTransactionService = () => ({
  createTransaction: jest.fn(),
  getTransaction: jest.fn(),
});

describe('TransactionController', () => {
  let controller: TransactionController;
  let service: TransactionService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [TransactionController],
      providers: [
        {
          provide: TransactionService,
          useFactory: mockTransactionService,
        },
      ],
    }).compile();

    controller = module.get<TransactionController>(TransactionController);
    service = module.get<TransactionService>(TransactionService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('createTransaction', () => {
    it('should call the service to create a transaction', async () => {
      const createTransactionDto: CreateTransactionDto = {
        accountExternalIdDebit: '550e8400-e29b-41d4-a716-446655440000',
        accountExternalIdCredit: '550e8400-e29b-41d4-a716-446655440001',
        tranferTypeId: 1,
        value: 120,
      };

      const savedTransaction: Transaction = {
        ...createTransactionDto,
        transactionExternalId: '550e8400-e29b-41d4-a716-446655440002',
        status: 'pending',
        createdAt: undefined,
      };

      jest
        .spyOn(service, 'createTransaction')
        .mockResolvedValue(savedTransaction);

      const result = await controller.createTransaction(createTransactionDto);

      expect(service.createTransaction).toHaveBeenCalledWith(
        createTransactionDto,
      );
      expect(result).toEqual(savedTransaction);
    });
  });

  describe('getTransaction', () => {
    it('should call the service to retrieve a transaction by ID', async () => {
      const transactionExternalId = '550e8400-e29b-41d4-a716-446655440002';

      const transaction: Transaction = {
        transactionExternalId,
        accountExternalIdDebit: '550e8400-e29b-41d4-a716-446655440000',
        accountExternalIdCredit: '550e8400-e29b-41d4-a716-446655440001',
        tranferTypeId: 1,
        value: 120,
        status: 'pending',
        createdAt: undefined,
      };

      jest.spyOn(service, 'getTransaction').mockResolvedValue(transaction);

      const result = await controller.getTransaction(transactionExternalId);

      expect(service.getTransaction).toHaveBeenCalledWith(
        transactionExternalId,
      );
      expect(result).toEqual(transaction);
    });
  });
});
