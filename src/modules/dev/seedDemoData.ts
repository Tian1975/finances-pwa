import { AccountRepository } from '../accounts/AccountRepository';
import { TransactionRepository } from '../transactions/TransactionRepository';
import { deleteDatabase } from '../../core/db/database';

/**
 * Genera dades de prova coherents: 2 comptes i ~50 moviments repartits
 * entre ells, amb dates dels últims dos mesos. Pensat per accelerar
 * el desenvolupament de la UI (Dashboard, llistes, filtres) sense
 * haver d'introduir dades manualment cada vegada. No forma part del
 * producte — només s'exposa en entorn de desenvolupament.
 */
export async function seedDemoData(): Promise<void> {
  await deleteDatabase();

  const accountRepository = new AccountRepository();
  const transactionRepository = new TransactionRepository();

  const compteCorrent = await accountRepository.add({
    name: 'Compte corrent',
    type: 'bank',
    currency: 'EUR',
    openingBalanceMinor: 100000,
  });

  const efectiu = await accountRepository.add({
    name: 'Efectiu',
    type: 'cash',
    currency: 'EUR',
    openingBalanceMinor: 5000,
  });

  const merchants: { merchant: string; amountMinor: number }[] = [
    { merchant: 'Mercadona', amountMinor: -4350 },
    { merchant: 'Mercadona', amountMinor: -2810 },
    { merchant: 'Gasolinera Repsol', amountMinor: -6500 },
    { merchant: 'Restaurant Can Solé', amountMinor: -3240 },
    { merchant: 'Lidl', amountMinor: -2178 },
    { merchant: 'Netflix', amountMinor: -1399 },
    { merchant: 'Farmàcia', amountMinor: -1850 },
    { merchant: 'Cafè', amountMinor: -320 },
    { merchant: 'Cafè', amountMinor: -280 },
    { merchant: 'Perruqueria', amountMinor: -2500 },
    { merchant: 'Devolució Zara', amountMinor: 3490 },
    { merchant: 'Nòmina', amountMinor: 215000 },
  ];

  let dayOffset = 0;
  const now = Date.now();

  for (let i = 0; i < 50; i++) {
    const template = merchants[i % merchants.length];
    // Repartit entre els dos comptes, amb la nòmina sempre al corrent.
    const accountId =
      template.merchant === 'Nòmina' || i % 4 !== 0
        ? compteCorrent.id
        : efectiu.id;

    dayOffset += Math.floor(Math.random() * 2); // dates no consecutives
    const date = new Date(now - dayOffset * 24 * 60 * 60 * 1000)
      .toISOString()
      .slice(0, 10);

    await transactionRepository.add({
      date,
      amountMinor: template.amountMinor,
      currency: 'EUR',
      accountId,
      categoryId: null,
      merchant: template.merchant,
      notes: null,
      tagIds: [],
      attachmentIds: [],
    });
  }
}
