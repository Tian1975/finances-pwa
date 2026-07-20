import { useAccountTransactions } from '../hooks/useAccountTransactions';
import { Amount } from '../components/Amount';
import type { Route } from '../Route';

interface TransactionsListPageProps {
  accountId: string;
  onNavigate: (route: Route) => void;
}

export function TransactionsListPage({
  accountId,
  onNavigate,
}: TransactionsListPageProps) {
  const { state, reload } = useAccountTransactions(accountId);

  return (
    <div className="min-h-screen bg-paper px-4 py-6 max-w-md mx-auto">
      <header className="flex items-center justify-between mb-6">
        <button
          onClick={() => onNavigate({ name: 'dashboard' })}
          className="text-sm text-ledger"
        >
          ← Comptes
        </button>
        <button
          onClick={() => onNavigate({ name: 'new-transaction', accountId })}
          className="text-sm font-medium text-paper bg-ledger rounded-full px-4 py-1.5"
        >
          + Nou moviment
        </button>
      </header>

      {state.status === 'loading' && (
        <p className="text-muted text-sm">Carregant...</p>
      )}

      {state.status === 'error' && (
        <div className="border border-debit/30 bg-debit/5 rounded-lg p-4">
          <p className="text-sm text-debit font-medium">
            No s'han pogut carregar els moviments.
          </p>
          <p className="text-xs text-muted mt-1">{state.message}</p>
          <button
            onClick={() => reload()}
            className="text-xs text-ledger mt-2 underline"
          >
            Torna-ho a provar
          </button>
        </div>
      )}

      {state.status === 'ready' && (
        <>
          <h1 className="text-xl font-semibold text-ink mb-4">
            {state.account.name}
          </h1>

          {state.transactions.length === 0 ? (
            <div className="border border-dashed border-ink/20 rounded-lg py-6 px-4 text-center">
              <p className="text-sm text-muted">
                Cap moviment encara en aquest compte.
              </p>
            </div>
          ) : (
            <ul className="divide-y divide-ink/10 border-y border-ink/10">
              {state.transactions.map((t) => (
                <li key={t.id} className="flex items-center justify-between py-3">
                  <div>
                    <p className="text-sm text-ink">
                      {t.merchant ?? 'Sense descripció'}
                    </p>
                    <p className="text-xs text-muted">{formatDate(t.date)}</p>
                  </div>
                  <Amount amountMinor={t.amountMinor} currency={t.currency} />
                </li>
              ))}
            </ul>
          )}
        </>
      )}
    </div>
  );
}

function formatDate(isoDate: string): string {
  return new Intl.DateTimeFormat('ca-ES', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(new Date(isoDate));
}
