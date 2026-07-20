import { useState, useEffect } from 'react';
import { TransactionRepository } from '../../modules/transactions/TransactionRepository';
import { AccountRepository } from '../../modules/accounts/AccountRepository';
import { MoneyInput } from '../components/MoneyInput';
import type { Route } from '../Route';

interface TransactionFormPageProps {
  accountId: string;
  onNavigate: (route: Route) => void;
}

const transactionRepository = new TransactionRepository();
const accountRepository = new AccountRepository();

export function TransactionFormPage({
  accountId,
  onNavigate,
}: TransactionFormPageProps) {
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [amountMinor, setAmountMinor] = useState<number | null>(null);
  const [merchant, setMerchant] = useState('');
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);

    if (amountMinor === null) {
      setError('Introdueix un import vàlid, per exemple 12,50.');
      return;
    }

    setSaving(true);
    try {
      const account = await accountRepository.findById(accountId);
      if (!account) {
        throw new Error('No existeix aquest compte.');
      }

      await transactionRepository.add({
        date,
        amountMinor,
        currency: account.currency,
        accountId,
        categoryId: null,
        merchant: merchant.trim() || null,
        notes: notes.trim() || null,
        tagIds: [],
        attachmentIds: [],
      });

      onNavigate({ name: 'transactions', accountId });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconegut en desar.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="min-h-screen bg-paper px-4 py-6 max-w-md mx-auto">
      <header className="mb-6">
        <button
          onClick={() => onNavigate({ name: 'transactions', accountId })}
          className="text-sm text-ledger"
        >
          ← Cancel·la
        </button>
      </header>

      <h1 className="text-xl font-semibold text-ink mb-1">Nou moviment</h1>
      <AccountName accountId={accountId} />

      <form onSubmit={handleSubmit} className="space-y-4 mt-4">
        <Field label="Data">
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            required
            className="w-full border border-ink/20 rounded-md px-3 py-2 text-sm text-ink bg-white"
          />
        </Field>

        <MoneyInput
          label="Import (€)"
          placeholder="43,50"
          valueMinor={amountMinor}
          onChange={setAmountMinor}
          required
        />

        <Field label="Comerç" hint="Opcional">
          <input
            type="text"
            placeholder="Mercadona"
            value={merchant}
            onChange={(e) => setMerchant(e.target.value)}
            className="w-full border border-ink/20 rounded-md px-3 py-2 text-sm text-ink bg-white"
          />
        </Field>

        <Field label="Notes" hint="Opcional">
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={2}
            className="w-full border border-ink/20 rounded-md px-3 py-2 text-sm text-ink bg-white"
          />
        </Field>

        {error && <p className="text-sm text-debit">{error}</p>}

        <button
          type="submit"
          disabled={saving}
          className="w-full bg-ledger text-paper rounded-md py-2.5 text-sm font-medium disabled:opacity-50"
        >
          {saving ? 'Desant...' : 'Desa el moviment'}
        </button>
      </form>
    </div>
  );
}

function AccountName({ accountId }: { accountId: string }) {
  const [name, setName] = useState<string | null>(null);

  useEffect(() => {
    accountRepository.findById(accountId).then((account) => {
      setName(account?.name ?? 'Compte desconegut');
    });
  }, [accountId]);

  return (
    <p className="text-sm text-muted">
      Al compte: <span className="font-medium text-ledger">{name ?? '...'}</span>
    </p>
  );
}

function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="block text-xs uppercase tracking-wide text-muted mb-1">
        {label}
      </span>
      {children}
      {hint && <span className="block text-xs text-muted mt-1">{hint}</span>}
    </label>
  );
}
