import { describe, it, expect, beforeEach, afterAll } from 'vitest';
import { DashboardService } from '../../modules/dashboard/DashboardService';
import { AccountRepository } from '../../modules/accounts/AccountRepository';
import { TransactionRepository } from '../../modules/transactions/TransactionRepository';
import { deleteDatabase } from '../../core/db/database';

describe('DashboardService', () => {
  let accountRepository: AccountRepository;
  let transactionRepository: TransactionRepository;
  let service: DashboardService;

  beforeEach(async () => {
    await deleteDatabase();
    accountRepository = new AccountRepository();
    transactionRepository = new TransactionRepository();
    service = new DashboardService(accountRepository, transactionRepository);
  });

  afterAll(async () => {
    await deleteDatabase();
  });

  it('getAccountBalance() retorna openingBalanceMinor quan no hi ha transaccions', async () => {
    const account = await accountRepository.add({
      name: 'Compte corrent',
      type: 'bank',
      currency: 'EUR',
      openingBalanceMinor: 100000,
    });

    const balance = await service.getAccountBalance(account.id);

    expect(balance).toBe(100000);
  });

  it('getAccountBalance() suma les transaccions actives al saldo d\'obertura', async () => {
    const account = await accountRepository.add({
      name: 'Compte corrent',
      type: 'bank',
      currency: 'EUR',
      openingBalanceMinor: 100000,
    });

    await transactionRepository.add({
      date: '2026-07-01',
      amountMinor: -5432,
      currency: 'EUR',
      accountId: account.id,
      categoryId: null,
      merchant: 'Mercadona',
      notes: null,
      tagIds: [],
      attachmentIds: [],
    });
    await transactionRepository.add({
      date: '2026-07-05',
      amountMinor: 215000,
      currency: 'EUR',
      accountId: account.id,
      categoryId: null,
      merchant: 'Nòmina',
      notes: null,
      tagIds: [],
      attachmentIds: [],
    });

    const balance = await service.getAccountBalance(account.id);

    expect(balance).toBe(100000 - 5432 + 215000);
  });

  it('getAccountBalance() ignora transaccions amb soft delete', async () => {
    const account = await accountRepository.add({
      name: 'Compte corrent',
      type: 'bank',
      currency: 'EUR',
      openingBalanceMinor: 0,
    });

    const transaction = await transactionRepository.add({
      date: '2026-07-01',
      amountMinor: -10000,
      currency: 'EUR',
      accountId: account.id,
      categoryId: null,
      merchant: 'Errònia',
      notes: null,
      tagIds: [],
      attachmentIds: [],
    });
    await transactionRepository.delete(transaction.id);

    const balance = await service.getAccountBalance(account.id);

    expect(balance).toBe(0);
  });

  it('getAccountBalance() ignora transaccions d\'altres comptes', async () => {
    const accountA = await accountRepository.add({
      name: 'A',
      type: 'bank',
      currency: 'EUR',
      openingBalanceMinor: 0,
    });
    const accountB = await accountRepository.add({
      name: 'B',
      type: 'bank',
      currency: 'EUR',
      openingBalanceMinor: 0,
    });

    await transactionRepository.add({
      date: '2026-07-01',
      amountMinor: -9999,
      currency: 'EUR',
      accountId: accountB.id,
      categoryId: null,
      merchant: 'No compta',
      notes: null,
      tagIds: [],
      attachmentIds: [],
    });

    const balance = await service.getAccountBalance(accountA.id);

    expect(balance).toBe(0);
  });

  it('getAccountBalance() llança un error si el compte no existeix', async () => {
    await expect(service.getAccountBalance('inexistent')).rejects.toThrow();
  });

  it('getAccountsWithBalance() retorna tots els comptes amb el seu saldo', async () => {
    const accountA = await accountRepository.add({
      name: 'Compte corrent',
      type: 'bank',
      currency: 'EUR',
      openingBalanceMinor: 100000,
    });
    const accountB = await accountRepository.add({
      name: 'Efectiu',
      type: 'cash',
      currency: 'EUR',
      openingBalanceMinor: 5000,
    });
    await transactionRepository.add({
      date: '2026-07-01',
      amountMinor: -2000,
      currency: 'EUR',
      accountId: accountA.id,
      categoryId: null,
      merchant: 'X',
      notes: null,
      tagIds: [],
      attachmentIds: [],
    });

    const results = await service.getAccountsWithBalance();

    expect(results).toHaveLength(2);
    const a = results.find((r) => r.account.id === accountA.id);
    const b = results.find((r) => r.account.id === accountB.id);
    expect(a?.balanceMinor).toBe(98000);
    expect(b?.balanceMinor).toBe(5000);
  });

  it('getRecentTransactions() ordena per data descendent i respecta el límit', async () => {
    const account = await accountRepository.add({
      name: 'Compte corrent',
      type: 'bank',
      currency: 'EUR',
      openingBalanceMinor: 0,
    });

    await transactionRepository.add({
      date: '2026-07-01',
      amountMinor: -100,
      currency: 'EUR',
      accountId: account.id,
      categoryId: null,
      merchant: 'Primer',
      notes: null,
      tagIds: [],
      attachmentIds: [],
    });
    await transactionRepository.add({
      date: '2026-07-15',
      amountMinor: -200,
      currency: 'EUR',
      accountId: account.id,
      categoryId: null,
      merchant: 'Mitjà',
      notes: null,
      tagIds: [],
      attachmentIds: [],
    });
    await transactionRepository.add({
      date: '2026-07-20',
      amountMinor: -300,
      currency: 'EUR',
      accountId: account.id,
      categoryId: null,
      merchant: 'Últim',
      notes: null,
      tagIds: [],
      attachmentIds: [],
    });

    const results = await service.getRecentTransactions(2);

    expect(results).toHaveLength(2);
    expect(results.map((t) => t.merchant)).toEqual(['Últim', 'Mitjà']);
  });
});
