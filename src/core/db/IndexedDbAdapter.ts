import type { BaseEntity, NewEntity } from '../types/BaseEntity';
import type { QueryOptions } from '../types/QueryOptions';
import type { Repository } from '../repository/Repository';
import { generateId } from '../utils/uuid';
import { openDatabase, type StoreName } from '../db/database';

/**
 * Implementació genèrica de Repository<T> sobre un object store d'IndexedDB.
 * Un mateix adapter serveix per a qualsevol entitat: n'hi ha prou de
 * parametritzar-lo amb el nom del store corresponent.
 *
 * Veure disseny-finances-pwa.md ("Repository API") i
 * disseny-fisic-indexeddb.md (stores i índexs).
 */
export class IndexedDbAdapter<T extends BaseEntity> implements Repository<T> {
  constructor(private readonly storeName: StoreName) {}

  async add(entity: NewEntity<T>): Promise<T> {
    const now = new Date().toISOString();
    const fullEntity = {
      ...entity,
      id: generateId(),
      createdAt: now,
      updatedAt: now,
      deletedAt: null,
    } as unknown as T;

    const store = await this.getStore('readwrite');
    await requestToPromise(store.add(fullEntity));
    return fullEntity;
  }

  async update(id: string, changes: Partial<T>): Promise<T> {
    const db = await openDatabase();
    const tx = db.transaction(this.storeName, 'readwrite');
    const store = tx.objectStore(this.storeName);

    const existing = (await requestToPromise(store.get(id))) as T | undefined;
    if (!existing) {
      throw new Error(
        `No es pot actualitzar: no existeix cap entitat amb id ${id} a ${this.storeName}`
      );
    }

    const updated: T = {
      ...existing,
      ...changes,
      id: existing.id, // id mai es sobreescriu
      updatedAt: new Date().toISOString(),
    };

    await requestToPromise(store.put(updated));
    return updated;
  }

  async delete(id: string): Promise<void> {
    // Soft delete per defecte (veure Regles de negoci). Les entitats
    // amb una política diferent (p.ex. Category amb `active`) no criden
    // aquest mètode tal qual, o el sobreescriuen al seu propi repository.
    await this.update(id, { deletedAt: new Date().toISOString() } as Partial<T>);
  }

  async findById(id: string): Promise<T | null> {
    const store = await this.getStore('readonly');
    const result = await requestToPromise(store.get(id));
    return (result as T) ?? null;
  }

  /**
   * Implementació MVP: recupera totes les entitats del store i aplica
   * where / orderBy / limit en memòria (veure applyQueryOptions).
   *
   * Decisió conscient, no un descuit: QueryOptions<T> és una API de
   * repositori, no una API d'IndexedDB, i optimitzar-la ara requeriria
   * un "query planner" (triar índex segons quins camps de `where`
   * estiguin indexats) que no està justificat sense un volum de dades
   * real que ho exigeixi.
   *
   * Millora futura (Sprint 3+): fer servir IDBIndex quan
   * QueryOptions.where contingui exactament un camp indexat.
   */
  async findAll(options?: QueryOptions<T>): Promise<T[]> {
    const store = await this.getStore('readonly');
    const all = await requestToPromise(store.getAll());
    return applyQueryOptions(all as T[], options);
  }

  async findUpdatedSince(timestamp: string): Promise<T[]> {
    const store = await this.getStore('readonly');
    const index = store.index('updatedAt');
    const range = IDBKeyRange.lowerBound(timestamp, false);
    const result = await requestToPromise(index.getAll(range));
    return result as T[];
  }

  async upsert(entity: T): Promise<T> {
    const db = await openDatabase();
    const tx = db.transaction(this.storeName, 'readwrite');
    const store = tx.objectStore(this.storeName);

    const existing = (await requestToPromise(store.get(entity.id))) as T | undefined;

    if (existing) {
      const updated: T = {
        ...existing,
        ...entity,
        id: existing.id,
        updatedAt: new Date().toISOString(),
      };
      await requestToPromise(store.put(updated));
      return updated;
    }

    // Inserció (típicament via sincronització): els timestamps formen
    // part de les dades rebudes i es preserven tal qual, no es
    // regeneren com faria un add() local.
    const now = new Date().toISOString();
    const toStore: T = {
      ...entity,
      createdAt: entity.createdAt ?? now,
      updatedAt: entity.updatedAt ?? now,
      deletedAt: entity.deletedAt ?? null,
    };
    await requestToPromise(store.put(toStore));
    return toStore;
  }

  private async getStore(
    mode: IDBTransactionMode
  ): Promise<IDBObjectStore> {
    const db = await openDatabase();
    const tx = db.transaction(this.storeName, mode);
    return tx.objectStore(this.storeName);
  }
}

/** Converteix un IDBRequest en una Promise. */
function requestToPromise<R>(request: IDBRequest<R>): Promise<R> {
  return new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

/**
 * Aplica where / orderBy / direction / limit en memòria, sobre el
 * resultat ja obtingut d'IndexedDB.
 *
 * Nota: per a filtres que es facin servir sovint sobre volums grans
 * (p.ex. transactions per accountId), val la pena fer servir un índex
 * directament (com a findUpdatedSince) en lloc de filtrar tot findAll()
 * en memòria — veure la regla al disseny físic d'IndexedDB.
 */
function applyQueryOptions<T>(items: T[], options?: QueryOptions<T>): T[] {
  let result = items;

  if (options?.where) {
    const whereEntries = Object.entries(options.where);
    result = result.filter((item) =>
      whereEntries.every(
        ([key, value]) => (item as Record<string, unknown>)[key] === value
      )
    );
  }

  if (options?.orderBy) {
    const { orderBy, direction = 'asc' } = options;
    result = [...result].sort((a, b) => {
      const aVal = a[orderBy];
      const bVal = b[orderBy];
      if (aVal === bVal) return 0;
      const comparison = aVal! < bVal! ? -1 : 1;
      return direction === 'asc' ? comparison : -comparison;
    });
  }

  if (options?.limit !== undefined) {
    result = result.slice(0, options.limit);
  }

  return result;
}
