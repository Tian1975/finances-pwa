import { IndexedDbAdapter } from '../../core/db/IndexedDbAdapter';
import { STORES } from '../../core/db/database';
import type { Category } from './Category';

/**
 * Repository de Category.
 *
 * Única excepció de política de "delete" de tot el domini: en lloc
 * del soft-delete via deletedAt que fa IndexedDbAdapter per defecte,
 * "esborrar" una categoria vol dir desactivar-la (active: false).
 *
 * Aquesta excepció viu aquí, a la capa de domini — IndexedDbAdapter
 * no sap res de Category ni d'`active`. Si mai apareixés la temptació
 * d'afegir "si el store és categories, fes X" dins d'IndexedDbAdapter,
 * seria senyal d'haver-se equivocat de capa.
 */
export class CategoryRepository extends IndexedDbAdapter<Category> {
  constructor() {
    super(STORES.categories);
  }

  /**
   * Sobreescriu el soft-delete genèric: desactiva la categoria en
   * lloc de marcar deletedAt (que Category ni tan sols declara).
   */
  override async delete(id: string): Promise<void> {
    await this.update(id, { active: false });
  }

  /** Torna a activar una categoria prèviament desactivada. */
  async reactivate(id: string): Promise<Category> {
    return this.update(id, { active: true });
  }
}
