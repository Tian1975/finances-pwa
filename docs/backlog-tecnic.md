# Backlog tècnic

Millores conegudes, deliberadament no aplicades encara perquè no arreglen cap bug ni aporten funcionalitat ara mateix. Es revisen quan una necessitat real ho justifiqui, no per anticipació.

## BaseEntity.deletedAt opcional (des de Category)

**Context:** per permetre que `Category` no tingui `deletedAt` (substituït per `active`), `BaseEntity.deletedAt` es va fer opcional (`deletedAt?: string | null`) en lloc d'obligatori.

**Cost d'aquesta decisió:** debilita el contracte de `BaseEntity`. Abans "tota entitat té `deletedAt`"; ara "potser sí, potser no" — cap entitat futura que s'oblidi d'assignar-lo rebrà avís del compilador.

**Alternativa considerada:** separar la jerarquia en dos nivells:

```typescript
interface EntityMetadata {
  id: string;
  createdAt: string;
  updatedAt: string;
}
interface SoftDeletableEntity extends EntityMetadata {
  deletedAt: string | null;
}
```

`Account`, `Transaction`, `Budget`, `Tag`, `Attachment`, `RecurringTransaction` extendrien `SoftDeletableEntity`; `Category` extendria només `EntityMetadata`.

**Per què no ara:** no arregla cap bug actual, no simplifica res del codi existent, i tocaria diversos fitxers sense aportar funcionalitat. El document de disseny, el codi i els tests ja deixen prou clar que `Category` és l'única excepció.

**Quan revisar-ho:** si en el futur apareix una segona entitat sense `deletedAt` (reforçant el patró), val la pena fer aquest refactor per recuperar la seguretat de tipus.

## Camp `deletedAt: null` mort a Category dins d'IndexedDB

`IndexedDbAdapter.add()` escriu `deletedAt: null` incondicionalment a tots els registres, incloent-hi `Category`, encara que el tipus `Category` no el declari. És metadada inert: cap codi el llegeix ni en depèn. Cost pràcticament zero — no es preveu corregir-ho.
