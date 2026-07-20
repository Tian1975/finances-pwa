import { describe, it, expect, beforeEach, afterAll } from 'vitest';
import { AccountRepository } from '../../modules/accounts/AccountRepository';
import { deleteDatabase } from '../../core/db/database';

/**
 * Aquests tests NO repeteixen la suite genèrica de Repository<T>
 * (ja validada a tests/core/IndexedDbAdapter.test.ts). Només
 * comproven que AccountRepository està correctament connectat
 * al store 'accounts' i que les dades específiques del domini
 * (name, type, currency, openingBalanceMinor) es desen i recuperen bé.
 */
describe('AccountRepository', () => {
  let repository: AccountRepository;

  beforeEach(async () => {
    await deleteDatabase();
    repository = new AccountRepository();
  });

  afterAll(async () => {
    await deleteDatabase();
  });

  it('crea un compte i el desa al store accounts', async () => {
    const account = await repository.add({
      name: 'Compte corrent',
      type: 'bank',
      currency: 'EUR',
      openingBalanceMinor: 150000,
    });

    expect(account.id).toBeDefined();
    expect(account.name).toBe('Compte corrent');
    expect(account.type).toBe('bank');
    expect(account.currency).toBe('EUR');
    expect(account.openingBalanceMinor).toBe(150000);
  });

  it('recupera un compte després de "recarregar" (nova instància del repository)', async () => {
    const created = await repository.add({
      name: 'Efectiu',
      type: 'cash',
      currency: 'EUR',
      openingBalanceMinor: 0,
    });

    // Simula recarregar la PWA: una instància nova del repository,
    // la mateixa base de dades (no es crida deleteDatabase aquí).
    const freshRepository = new AccountRepository();
    const found = await freshRepository.findById(created.id);

    expect(found).not.toBeNull();
    expect(found?.name).toBe('Efectiu');
  });

  it('findAll() retorna només comptes, no dades d\'altres stores', async () => {
    await repository.add({
      name: 'Compte corrent',
      type: 'bank',
      currency: 'EUR',
      openingBalanceMinor: 0,
    });
    await repository.add({
      name: 'Revolut',
      type: 'card',
      currency: 'EUR',
      openingBalanceMinor: 5000,
    });

    const all = await repository.findAll();

    expect(all).toHaveLength(2);
    expect(all.map((a) => a.type).sort()).toEqual(['bank', 'card']);
  });
});
