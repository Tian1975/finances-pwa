import { useState } from 'react';

interface MoneyInputProps {
  label: string;
  hint?: string;
  valueMinor: number | null;
  onChange: (minor: number | null) => void;
  placeholder?: string;
  required?: boolean;
  showSignToggle?: boolean;
}

export function MoneyInput({
  label,
  hint,
  valueMinor,
  onChange,
  placeholder,
  required,
  showSignToggle = true,
}: MoneyInputProps) {
  const [text, setText] = useState(() =>
    valueMinor !== null ? Math.abs(valueMinor / 100).toFixed(2).replace('.', ',') : ''
  );
  const [isExpense, setIsExpense] = useState(() => (valueMinor ?? 0) < 0);

  function handleTextChange(raw: string) {
    setText(raw);
    emit(raw, isExpense);
  }

  function handleSignChange(expense: boolean) {
    setIsExpense(expense);
    emit(text, expense);
  }

  function emit(raw: string, expense: boolean) {
    const magnitude = parsePositiveAmountToMinor(raw);
    if (magnitude === null) {
      onChange(null);
      return;
    }
    onChange(expense ? -magnitude : magnitude);
  }

  return (
    <div>
      <span className="block text-xs uppercase tracking-wide text-muted mb-1">
        {label}
      </span>

      {showSignToggle && (
        <div className="flex gap-2 mb-2">
          <button
            type="button"
            onClick={() => handleSignChange(false)}
            className={`flex-1 rounded-md py-1.5 text-sm font-medium border ${
              !isExpense
                ? 'bg-ledger text-paper border-ledger'
                : 'bg-white text-muted border-ink/20'
            }`}
          >
            Ingrés
          </button>
          <button
            type="button"
            onClick={() => handleSignChange(true)}
            className={`flex-1 rounded-md py-1.5 text-sm font-medium border ${
              isExpense
                ? 'bg-debit text-paper border-debit'
                : 'bg-white text-muted border-ink/20'
            }`}
          >
            Despesa
          </button>
        </div>
      )}

      <input
        type="text"
        inputMode="decimal"
        placeholder={placeholder}
        value={text}
        onChange={(e) => handleTextChange(e.target.value)}
        required={required}
        className="w-full border border-ink/20 rounded-md px-3 py-2 text-sm text-ink bg-white tabular-amount"
      />
      {hint && <span className="block text-xs text-muted mt-1">{hint}</span>}
    </div>
  );
}

function parsePositiveAmountToMinor(input: string): number | null {
  const normalized = input.trim().replace(',', '.').replace(/^-/, '');
  if (normalized === '' || Number.isNaN(Number(normalized))) {
    return null;
  }
  return Math.round(Number(normalized) * 100);
}
