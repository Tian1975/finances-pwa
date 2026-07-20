import { IndexedDbAdapter } from '../../core/db/IndexedDbAdapter';
import { STORES } from '../../core/db/database';
import type { Account } from './Account';

/**
 * Repository d'Account. No afegeix cap comportament nou: és la prova
 * que IndexedDbAdapter<T> ja implementa tot el contracte genèric
 * necessari. Quan calguin consultes pròpies d'Account (que ara mateix
 * no n'hi ha cap), aquesta classe és el lloc on afegir-les.
 */
export class AccountRepository extends IndexedDbAdapter<Account> {
  constructor() {
    super(STORES.accounts);
  }
}
