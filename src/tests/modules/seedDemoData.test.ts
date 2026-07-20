import { describe, it, expect, afterAll } from 'vitest';
import { seedDemoData } from '../../modules/dev/seedDemoData';
import { AccountRepository } from '../../modules/accounts/AccountRepository';
import { TransactionRepository } from '../../modules/transactions/TransactionRepository';
import { DashboardService } from '../../modules/dashboard/DashboardService';
import { deleteDatabase } from '../../core/db/database';

describe('seedDemoData', () => {
  afterAll(async () => {
    await deleteDatabase();
  });

  it('crea exactament 2 comptes i 50 moviments', async () => {
    await seedDemoData();

    const accountRepository = new AccountRepository();
    const transactionRepository = new TransactionRepository();

    const accounts = await accountRepository.findAll();
    const transactions = await transactionRepository.findAll();

    expect(accounts).toHaveLength(2);
    expect(transactions).toHaveLength(50);
  });

  it('genera un saldo coherent i calculable pel DashboardService', async () => {
    await seedDemoData();

    const accountRepository = new AccountRepository();
    const transactionRepository = new TransactionRepository();
    const service = new DashboardService(accountRepository, transactionRepository);

    const results = await service.getAccountsWithBalance();

    expect(results).toHaveLength(2);
    // El saldo no ha de ser NaN ni undefined per a cap compte.
    for (const { balanceMinor } of results) {
      expect(Number.isFinite(balanceMinor)).toBe(true);
    }
  });

  it('cada moviment pertany a un dels dos comptes creats', async () => {
    await seedDemoData();

    const accountRepository = new AccountRepository();
    const transactionRepository = new TransactionRepository();

    const accounts = await accountRepository.findAll();
    const accountIds = new Set(accounts.map((a) => a.id));
    const transactions = await transactionRepository.findAll();

    expect(transactions.every((t) => accountIds.has(t.accountId))).toBe(true);
  });
});
