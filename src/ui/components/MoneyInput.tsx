import { useState, useEffect } from 'react';

interface MoneyInputProps {
  label: string;
  hint?: string;
  valueMinor: number | null;
  onChange: (minor: number | null) => void;
  placeholder?: string;
  required?: boolean;
}

/**
 * Camp d'entrada d'imports monetaris. Única responsable de convertir
 * el que l'usuari escriu (amb coma o punt decimal) a amountMinor
 * (enter, cèntims). Es reutilitza a Nou compte (openingBalanceMinor),
 * Nova transacció (amountMinor) i, quan existeixin, Budget i
 * RecurringTransaction.
 */
export function MoneyInput({
  label,
  hint,
  valueMinor,
  onChange,
  placeholder,
  required,
}: MoneyInputProps) {
  const [text, setText] = useState(() => minorToText(valueMinor));

  // Si el valor canvia des de fora (p.ex. es reinicia el formulari),
  // reflectim-ho al text mostrat.
  useEffect(() => {
    setText(minorToText(valueMinor));
  }, [valueMinor]);

  function handleChange(raw: string) {
    setText(raw);
    onChange(parseAmountToMinor(raw));
  }

  return (
    <label className="block">
      <span className="block text-xs uppercase tracking-wide text-muted mb-1">
        {label}
      </span>
      <input
        type="text"
        inputMode="decimal"
        placeholder={placeholder}
        value={text}
        onChange={(e) => handleChange(e.target.value)}
        required={required}
        className="w-full border border-ink/20 rounded-md px-3 py-2 text-sm text-ink bg-white tabular-amount"
      />
      {hint && <span className="block text-xs text-muted mt-1">{hint}</span>}
    </label>
  );
}

function minorToText(minor: number | null): string {
  if (minor === null) return '';
  return (minor / 100).toFixed(2).replace('.', ',');
}

/**
 * Converteix un import escrit per l'usuari (p.ex. "-43,50" o "2150")
 * a cèntims (enter). Accepta coma o punt com a separador decimal.
 * Retorna null si l'entrada no és un número vàlid o és buida.
 */
export function parseAmountToMinor(input: string): number | null {
  const normalized = input.trim().replace(',', '.');
  if (normalized === '' || Number.isNaN(Number(normalized))) {
    return null;
  }
  return Math.round(Number(normalized) * 100);
}
