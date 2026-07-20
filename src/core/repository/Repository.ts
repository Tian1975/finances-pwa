import type { BaseEntity, NewEntity } from '../types/BaseEntity';
import type { QueryOptions } from '../types/QueryOptions';

/**
 * Contracte únic pel qual passa tota lectura/escriptura de dades.
 * Cap component de la UI ni cap connector de sincronització accedeix
 * mai directament a IndexedDB — sempre a través d'aquesta interfície.
 *
 * Veure disseny-finances-pwa.md, secció "Repository API".
 */
export interface Repository<T extends BaseEntity> {
  /** Crea una nova entitat. id, createdAt, updatedAt i deletedAt els genera el Repository. */
  add(entity: NewEntity<T>): Promise<T>;

  /** Actualitza parcialment una entitat existent. Actualitza updatedAt automàticament. */
  update(id: string, changes: Partial<T>): Promise<T>;

  /** Soft delete: marca deletedAt amb la data actual. No esborra físicament el registre. */
  delete(id: string): Promise<void>;

  /** Cerca una entitat pel seu id. Retorna null si no existeix. */
  findById(id: string): Promise<T | null>;

  /** Cerca totes les entitats que compleixen les opcions donades. */
  findAll(options?: QueryOptions<T>): Promise<T[]>;

  /**
   * Cerca totes les entitats modificades des d'un timestamp donat (inclòs).
   * Mètode clau per a qualsevol sincronització futura: no cal enviar
   * mai la base sencera, només allò que ha canviat.
   */
  findUpdatedSince(timestamp: string): Promise<T[]>;

  /**
   * Update si l'entitat existeix, insert si no. Imprescindible per als
   * connectors de sincronització (evita el patró find/if/update-o-add).
   */
  upsert(entity: T): Promise<T>;
}
