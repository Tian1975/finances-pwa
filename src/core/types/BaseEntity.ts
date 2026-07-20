/**
 * Tipus base que comparteixen totes les entitats del domini.
 * Veure disseny-finances-pwa.md, secció "Repository API" i "Principis d'arquitectura".
 */
export interface BaseEntity {
  /** Identificador immutable, UUID v4 (veure Principis d'arquitectura). */
  id: string;
  /** Data de creació, ISO 8601 en UTC. */
  createdAt: string;
  /** Data de l'última modificació, ISO 8601 en UTC. */
  updatedAt: string;
  /**
   * Soft delete per defecte (veure Regles de negoci).
   * `null` si l'entitat és activa. Algunes entitats (p.ex. Category)
   * substitueixen aquest camp per `active` i no en tenen — per això
   * és opcional aquí, no obligatori.
   */
  deletedAt?: string | null;
}

/**
 * Camps que el Repository genera automàticament en fer `add()`:
 * l'usuari no els proporciona, el sistema els calcula.
 */
export type NewEntity<T extends BaseEntity> = Omit<
  T,
  'id' | 'createdAt' | 'updatedAt' | 'deletedAt'
>;
