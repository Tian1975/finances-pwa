import { describe, it, expect, beforeEach, afterAll } from 'vitest';
import { TransactionRepository } from '../../modules/transactions/TransactionRepository';
import { deleteDatabase } from '../../core/db/database';
import type { Transaction } from '../../modules/transactions/Transaction';

/**
 * No repeteix el CRUD genèric (ja validat a IndexedDbAdapter.test.ts).
 * Comprova només: connexió correcta al store 'transactions',
 * persistència real entre instàncies, i findUpdatedSince() —
 * el mètode que farà servir la sincronització futura — amb
 * l'entitat de domini real, no la fictícia.
 */
describe('TransactionRepository', () => {
  let repository: TransactionRepository;

  const baseTransaction: Omit<
    Transaction,
    'id' | 'createdAt' | 'updatedAt' | 'deletedAt'
  > = {
    date: '2026-07-20',
    amountMinor: -5432,
    currency: 'EUR',
    accountId: 'acc-1',
    categoryId: null,
    merchant: 'Mercadona',
    notes: null,
    tagIds: [],
    attachmentIds: [],
  };

  beforeEach(async () => {
    await deleteDatabase();
    repository = new TransactionRepository();
  });

  afterAll(async () => {
    await deleteDatabase();
  });

  it('crea una transacció i la desa al store transactions', async () => {
    const created = await repository.add(baseTransaction);

    expect(created.id).toBeDefined();
    expect(created.amountMinor).toBe(-5432);
    expect(created.merchant).toBe('Mercadona');
    expect(created.accountId).toBe('acc-1');
  });

  it('no valida que accountId correspongui a un Account existent', async () => {
    // Deliberadament: el Repository no coneix Account. Aquest test
    // documenta explícitament el límit de responsabilitat acordat.
    const created = await repository.add({
      ...baseTransaction,
      accountId: 'compte-que-no-existeix',
    });

    expect(created.accountId).toBe('compte-que-no-existeix');
  });

  it('recupera una transacció després de "recarregar" (nova instància del repository)', async () => {
    const created = await repository.add(baseTransaction);

    const freshRepository = new TransactionRepository();
    const found = await freshRepository.findById(created.id);

    expect(found).not.toBeNull();
    expect(found?.merchant).toBe('Mercadona');
  });

  it('findUpdatedSince() funciona amb Transaction real', async () => {
    const before = new Date().toISOString();
    await new Promise((resolve) => setTimeout(resolve, 5));
    const afterFirst = new Date().toISOString();

    await repository.add(baseTransaction);

    const recentOnly = await repository.findUpdatedSince(afterFirst);
    expect(recentOnly).toHaveLength(1);

    const all = await repository.findUpdatedSince(before);
    expect(all).toHaveLength(1);
  });
});
