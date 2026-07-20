import type { BaseEntity } from '../../core/types/BaseEntity';

/**
 * Compte on hi ha diners: compte bancari, efectiu, targeta, etc.
 * Veure disseny-finances-pwa.md, secció 1 "Entitats" — Account.
 *
 * Només dades, cap comportament ni validació. Les regles de negoci
 * (p.ex. "la moneda ha de ser un codi ISO vàlid") s'afegiran quan
 * aparegui un cas d'ús real que les necessiti, no per anticipació.
 */
export type AccountType = 'bank' | 'cash' | 'card' | 'other';

export interface Account extends BaseEntity {
  name: string;
  type: AccountType;
  currency: string; // ISO 4217, p.ex. 'EUR'
  /**
   * Saldo d'obertura, en unitats mínimes (cèntims), abans de començar
   * a registrar moviments a l'app. El saldo "actual" d'un compte no es
   * guarda aquí: es deriva com openingBalanceMinor + suma de
   * Transaction.amountMinor associades a aquest compte. Guardar un
   * saldo actual com a camp propi crearia dues fonts de veritat.
   */
  openingBalanceMinor: number;
}
