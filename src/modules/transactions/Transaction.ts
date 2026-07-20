import type { BaseEntity } from '../../core/types/BaseEntity';

/**
 * El registre central de l'aplicació.
 * Veure disseny-finances-pwa.md, secció 1 "Entitats" — Transaction.
 *
 * Només dades, cap comportament ni validació. En particular: aquesta
 * interfície NO valida que accountId o categoryId existeixin — la
 * validació de claus foranes és responsabilitat de la capa de
 * servei/negoci, no del Repository ni de la definició de l'entitat
 * (veure nota a TransactionRepository.ts).
 */
export interface Transaction extends BaseEntity {
  date: string; // ISO date
  amountMinor: number; // unitats mínimes (cèntims); positiu = ingrés, negatiu = despesa
  currency: string; // ISO 4217. Ha de coincidir amb Account.currency (regla de negoci, no validada aquí)
  accountId: string;
  categoryId: string | null;
  merchant: string | null;
  notes: string | null;
  tagIds: string[];
  attachmentIds: string[];
}
