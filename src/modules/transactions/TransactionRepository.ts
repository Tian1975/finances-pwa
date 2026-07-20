import { IndexedDbAdapter } from '../../core/db/IndexedDbAdapter';
import { STORES } from '../../core/db/database';
import type { Transaction } from './Transaction';

/**
 * Repository de Transaction.
 *
 * Regla de projecte: el Repository NO valida claus foranes
 * (accountId, categoryId). Només persisteix dades. Si accountId
 * apunta a un Account inexistent, add()/update() l'accepten igualment
 * — comprovar que l'Account existeix és responsabilitat d'una futura
 * capa de servei/negoci, no d'aquesta classe.
 *
 * Separació:
 * - Repository   → persistència.
 * - Domini/serveis → regles de negoci (incloent validació de relacions).
 * - UI           → presentació.
 *
 * Sense mètodes propis encara (p.ex. findByAccountId()): s'afegiran
 * només quan un cas d'ús real ho exigeixi, no per anticipació.
 */
export class TransactionRepository extends IndexedDbAdapter<Transaction> {
  constructor() {
    super(STORES.transactions);
  }
}
