interface AmountProps {
  amountMinor: number;
  currency?: string;
}

/**
 * Única capa que converteix cèntims → euros per mostrar-los (veure
 * disseny-finances-pwa.md, secció "Exportació i propietat de les
 * dades" i regles de negoci sobre amountMinor). Cap altre lloc de la
 * UI hauria de fer aquesta divisió per 100 directament.
 */
export function Amount({ amountMinor, currency = 'EUR' }: AmountProps) {
  const value = amountMinor / 100;
  const isNegative = amountMinor < 0;
  const formatted = new Intl.NumberFormat('ca-ES', {
    style: 'currency',
    currency,
    signDisplay: 'exceptZero',
  }).format(value);

  return (
    <span
      className={`tabular-amount font-medium ${
        isNegative ? 'text-debit' : 'text-ledger'
      }`}
    >
      {formatted}
    </span>
  );
}
