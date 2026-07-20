import { useDashboard } from '../hooks/useDashboard';
import { Amount } from '../components/Amount';
import { seedDemoData } from '../../modules/dev/seedDemoData';
import type { Route } from '../Route';

interface DashboardPageProps {
  onSelectAccount: (route: Route) => void;
  onNavigate: (route: Route) => void;
}

export function DashboardPage({ onSelectAccount, onNavigate }: DashboardPageProps) {
  const state = useDashboard();

  return (
    <div className="min-h-screen bg-paper px-4 py-6 max-w-md mx-auto">
      <header className="flex items-start justify-between mb-6">
        <div>
          <p className="text-xs uppercase tracking-wide text-muted mb-1">
            {formatToday()}
          </p>
          <h1 className="text-xl font-semibold text-ink">Comptes</h1>
        </div>
        <button
          onClick={() => onNavigate({ name: 'new-account' })}
          className="text-sm font-medium text-paper bg-ledger rounded-full px-4 py-1.5 whitespace-nowrap"
        >
          + Compte
        </button>
      </header>

      {state.status === 'loading' && (
        <p className="text-muted text-sm">Carregant...</p>
      )}

      {state.status === 'error' && (
        <div className="border border-debit/30 bg-debit/5 rounded-lg p-4">
          <p className="text-sm text-debit font-medium">
            No s'ha pogut carregar el tauler.
          </p>
          <p className="text-xs text-muted mt-1">{state.message}</p>
        </div>
      )}

      {state.status === 'ready' && (
        <>
          <AccountsList accounts={state.accounts} onSelectAccount={onSelectAccount} />
          <RecentTransactionsList transactions={state.recentTransactions} />
        </>
      )}

      {import.meta.env.DEV && (
        <button
          onClick={async () => {
            await seedDemoData();
            window.location.reload();
          }}
          className="mt-10 text-xs text-muted underline block mx-auto"
        >
          [dev] Carregar dades de prova
        </button>
      )}
    </div>
  );
}

function formatToday(): string {
  return new Intl.DateTimeFormat('ca-ES', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  }).format(new Date());
}

function AccountsList({
  accounts,
  onSelectAccount,
}: {
  accounts: import('../../modules/dashboard/DashboardService').AccountWithBalance[];
  onSelectAccount: (route: Route) => void;
}) {
  if (accounts.length === 0) {
    return (
      <section className="mb-8">
        <EmptyState message="Encara no hi ha cap compte. Afegeix-ne un per començar a veure el teu saldo." />
      </section>
    );
  }

  return (
    <section className="mb-8">
      <ul className="divide-y divide-ink/10 border-y border-ink/10">
        {accounts.map(({ account, balanceMinor }) => (
          <li key={account.id}>
            <button
              onClick={() => onSelectAccount({ name: 'transactions', accountId: account.id })}
              className="w-full flex items-center justify-between py-3 text-left"
            >
              <div>
                <p className="text-sm font-medium text-ink">{account.name}</p>
                <p className="text-xs text-muted">{accountTypeLabel(account.type)}</p>
              </div>
              <Amount amountMinor={balanceMinor} currency={account.currency} />
            </button>
          </li>
        ))}
      </ul>
    </section>
  );
}

function RecentTransactionsList({
  transactions,
}: {
  transactions: import('../../modules/transactions/Transaction').Transaction[];
}) {
  return (
    <section>
      <h2 className="text-xs uppercase tracking-wide text-muted mb-2">
        Últims moviments
      </h2>
      {transactions.length === 0 ? (
        <EmptyState message="Cap moviment encara. Els que registris apareixeran aquí." />
      ) : (
        <ul className="divide-y divide-ink/10 border-y border-ink/10">
          {transactions.map((t) => (
            <li key={t.id} className="flex items-center justify-between py-3">
              <div>
                <p className="text-sm text-ink">{t.merchant ?? 'Sense descripció'}</p>
                <p className="text-xs text-muted">{formatDate(t.date)}</p>
              </div>
              <Amount amountMinor={t.amountMinor} currency={t.currency} />
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className="border border-dashed border-ink/20 rounded-lg py-6 px-4 text-center">
      <p className="text-sm text-muted">{message}</p>
    </div>
  );
}

function accountTypeLabel(type: string): string {
  const labels: Record<string, string> = {
    bank: 'Compte bancari',
    cash: 'Efectiu',
    card: 'Targeta',
    other: 'Altre',
  };
  return labels[type] ?? type;
}

function formatDate(isoDate: string): string {
  return new Intl.DateTimeFormat('ca-ES', {
    day: 'numeric',
    month: 'short',
  }).format(new Date(isoDate));
}
