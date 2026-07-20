import { useState } from 'react';
import { AccountRepository } from '../../modules/accounts/AccountRepository';
import type { AccountType } from '../../modules/accounts/Account';
import { MoneyInput } from '../components/MoneyInput';
import type { Route } from '../Route';

interface AccountFormPageProps {
  onNavigate: (route: Route) => void;
}

const accountRepository = new AccountRepository();

const ACCOUNT_TYPES: { value: AccountType; label: string }[] = [
  { value: 'bank', label: 'Compte bancari' },
  { value: 'cash', label: 'Efectiu' },
  { value: 'card', label: 'Targeta' },
  { value: 'other', label: 'Altre' },
];

export function AccountFormPage({ onNavigate }: AccountFormPageProps) {
  const [name, setName] = useState('');
  const [type, setType] = useState<AccountType>('bank');
  const [currency] = useState('EUR'); // únic valor per ara; sense selector, no cal encara
  const [openingBalanceMinor, setOpeningBalanceMinor] = useState<number | null>(0);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);

    if (name.trim() === '') {
      setError('El nom del compte no pot estar buit.');
      return;
    }
    if (openingBalanceMinor === null) {
      setError('Introdueix un saldo d\'obertura vàlid (pot ser 0).');
      return;
    }

    setSaving(true);
    try {
      await accountRepository.add({
        name: name.trim(),
        type,
        currency,
        openingBalanceMinor,
      });
      onNavigate({ name: 'dashboard' });
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
          onClick={() => onNavigate({ name: 'dashboard' })}
          className="text-sm text-ledger"
        >
          ← Cancel·la
        </button>
      </header>

      <h1 className="text-xl font-semibold text-ink mb-6">Nou compte</h1>

      <form onSubmit={handleSubmit} className="space-y-4">
        <label className="block">
          <span className="block text-xs uppercase tracking-wide text-muted mb-1">
            Nom
          </span>
          <input
            type="text"
            placeholder="Compte corrent"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            className="w-full border border-ink/20 rounded-md px-3 py-2 text-sm text-ink bg-white"
          />
        </label>

        <label className="block">
          <span className="block text-xs uppercase tracking-wide text-muted mb-1">
            Tipus
          </span>
          <select
            value={type}
            onChange={(e) => setType(e.target.value as AccountType)}
            className="w-full border border-ink/20 rounded-md px-3 py-2 text-sm text-ink bg-white"
          >
            {ACCOUNT_TYPES.map((t) => (
              <option key={t.value} value={t.value}>
                {t.label}
              </option>
            ))}
          </select>
        </label>

        <MoneyInput
          label="Saldo d'obertura (€)"
          hint="El saldo actual del compte en el moment de començar a fer-lo servir a l'app"
          placeholder="0,00"
          valueMinor={openingBalanceMinor}
          onChange={setOpeningBalanceMinor}
          required
        />

        {error && <p className="text-sm text-debit">{error}</p>}

        <button
          type="submit"
          disabled={saving}
          className="w-full bg-ledger text-paper rounded-md py-2.5 text-sm font-medium disabled:opacity-50"
        >
          {saving ? 'Desant...' : 'Desa el compte'}
        </button>
      </form>
    </div>
  );
}
