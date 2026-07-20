/**
 * Navegació mínima basada en estat de React, sense cap llibreria de
 * routing. Suficient per al vertical slice actual (Dashboard →
 * Moviments → Formulari). Si el nombre de pantalles creix, val la
 * pena substituir-ho per un router real — no s'ha fet ara per no
 * anticipar-se a una necessitat que encara no existeix.
 */
export type Route =
  | { name: 'dashboard' }
  | { name: 'new-account' }
  | { name: 'transactions'; accountId: string }
  | { name: 'new-transaction'; accountId: string };
