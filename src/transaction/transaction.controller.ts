import { Controller, Post, Get, Param, Body } from '@nestjs/common';
import { TransactionService } from './transaction.service';
import { CreateTransactionDto } from 'src/common/dtos/create.transaction.dto';
import { Transaction } from 'src/entity/transaction.entity';

@Controller('transaction')
export class TransactionController {
  constructor(private readonly transactionService: TransactionService) {}

  @Post()
  async createTransaction(
    @Body() createTransactionDto: CreateTransactionDto,
  ): Promise<Transaction> {
    return this.transactionService.createTransaction(createTransactionDto);
  }

  @Get(':transactionExternalId')
  async getTransaction(
    @Param('transactionExternalId') transactionExternalId: string,
  ): Promise<Transaction> {
    return this.transactionService.getTransaction(transactionExternalId);
  }
}
