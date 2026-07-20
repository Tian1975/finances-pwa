import { useEffect, useState } from 'react';
import { DashboardService, type AccountWithBalance } from '../../modules/dashboard/DashboardService';
import { AccountRepository } from '../../modules/accounts/AccountRepository';
import { TransactionRepository } from '../../modules/transactions/TransactionRepository';
import type { Transaction } from '../../modules/transactions/Transaction';

type DashboardState =
  | { status: 'loading' }
  | { status: 'error'; message: string }
  | {
      status: 'ready';
      accounts: AccountWithBalance[];
      recentTransactions: Transaction[];
    };

const service = new DashboardService(
  new AccountRepository(),
  new TransactionRepository()
);

/**
 * Hook de UI: gestiona l'estat de càrrega i exposa les dades ja
 * calculades pel DashboardService. Cap component que faci servir
 * aquest hook necessita saber res d'IndexedDB, Repository ni de la
 * regla del saldo derivat.
 */
export function useDashboard() {
  const [state, setState] = useState<DashboardState>({ status: 'loading' });

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const [accounts, recentTransactions] = await Promise.all([
          service.getAccountsWithBalance(),
          service.getRecentTransactions(10),
        ]);
        if (!cancelled) {
          setState({ status: 'ready', accounts, recentTransactions });
        }
      } catch (err) {
        if (!cancelled) {
          const message = err instanceof Error ? err.message : 'Error desconegut';
          setState({ status: 'error', message });
        }
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, []);

  return state;
}
