import type { BaseEntity } from '../../core/types/BaseEntity';

/**
 * Categoria de moviments. Veure disseny-finances-pwa.md, secció 1
 * "Entitats" — Category, i Regles de negoci: "una categoria pot
 * desactivar-se, però no eliminar-se".
 *
 * A diferència de la resta d'entitats, NO té deletedAt: les categories
 * no s'esborren mai (350 moviments dels últims 3 anys no poden quedar
 * òrfens de categoria). En el seu lloc, `active` marca si es mostra
 * com a opció disponible per a noves transaccions.
 */
export interface Category extends BaseEntity {
  name: string;
  icon: string | null;
  active: boolean;
}
