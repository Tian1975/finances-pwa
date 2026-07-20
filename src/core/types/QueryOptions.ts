/**
 * Opcions de consulta per a `Repository.findAll()`.
 * Veure disseny-finances-pwa.md, secció "Repository API".
 */
export interface QueryOptions<T> {
  /** Filtre per igualtat exacta de camps. */
  where?: Partial<T>;
  /** Camp pel qual ordenar els resultats. */
  orderBy?: keyof T;
  /** Direcció de l'ordenació. Per defecte 'asc'. */
  direction?: 'asc' | 'desc';
  /** Nombre màxim de resultats. */
  limit?: number;
}
