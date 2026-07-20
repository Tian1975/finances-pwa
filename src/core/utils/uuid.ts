/**
 * Generador d'identificadors.
 * Decisió fixada al document de disseny: UUID v4 (Principis d'arquitectura).
 *
 * Fa servir `crypto.randomUUID()` quan està disponible (Safari iOS moderns,
 * i qualsevol context segur — https o localhost). Inclou un fallback manual
 * per si mai cal executar-se en un context on `crypto.randomUUID` no existeixi.
 */
export function generateId(): string {
  if (
    typeof crypto !== 'undefined' &&
    typeof crypto.randomUUID === 'function'
  ) {
    return crypto.randomUUID();
  }
  return fallbackUuidV4();
}

/**
 * Fallback sense dependències externes, basat en crypto.getRandomValues
 * quan estigui disponible, i Math.random com a últim recurs.
 * No s'espera que s'utilitzi mai a producció (Safari iOS suporta
 * randomUUID des de fa temps), però evita que el projecte falli
 * silenciosament si algun dia s'executa en un entorn no segur.
 */
function fallbackUuidV4(): string {
  const getRandomByte = (): number => {
    if (typeof crypto !== 'undefined' && typeof crypto.getRandomValues === 'function') {
      const arr = new Uint8Array(1);
      crypto.getRandomValues(arr);
      return arr[0];
    }
    return Math.floor(Math.random() * 256);
  };

  const bytes = new Array(16).fill(0).map(() => getRandomByte());
  bytes[6] = (bytes[6] & 0x0f) | 0x40; // versió 4
  bytes[8] = (bytes[8] & 0x3f) | 0x80; // variant RFC 4122

  const hex = bytes.map((b) => b.toString(16).padStart(2, '0'));
  return (
    hex.slice(0, 4).join('') +
    '-' +
    hex.slice(4, 6).join('') +
    '-' +
    hex.slice(6, 8).join('') +
    '-' +
    hex.slice(8, 10).join('') +
    '-' +
    hex.slice(10, 16).join('')
  );
}
