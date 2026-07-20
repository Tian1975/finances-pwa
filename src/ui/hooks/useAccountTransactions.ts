import { useEffect, useState, useCallback } from 'react';
import { TransactionRepository } from '../../modules/transactions/TransactionRepository';
import { AccountRepository } from '../../modules/accounts/AccountRepository';
import type { Transaction } from '../../modules/transactions/Transaction';
import type { Account } from '../../modules/accounts/Account';

type TransactionsState =
  | { status: 'loading' }
  | { status: 'error'; message: string }
  | { status: 'ready'; account: Account; transactions: Transaction[] };

const transactionRepository = new TransactionRepository();
const accountRepository = new AccountRepository();

/**
 * Hook de UI: llista de moviments d'un compte concret, ordenats per
 * data descendent. Exposa reload() perquè la pantalla de formulari
 * pugui refrescar aquesta llista després de crear una transacció,
 * sense que cap component conegui IndexedDB.
 */
export function useAccountTransactions(accountId: string) {
  const [state, setState] = useState<TransactionsState>({ status: 'loading' });

  const load = useCallback(async () => {
    setState({ status: 'loading' });
    try {
      const account = await accountRepository.findById(accountId);
      if (!account) {
        setState({ status: 'error', message: 'No existeix aquest compte.' });
        return;
      }
      const transactions = await transactionRepository.findAll({
        where: { accountId, deletedAt: null },
        orderBy: 'date',
        direction: 'desc',
      });
      setState({ status: 'ready', account, transactions });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error desconegut';
      setState({ status: 'error', message });
    }
  }, [accountId]);

  useEffect(() => {
    load();
  }, [load]);

  return { state, reload: load };
}
