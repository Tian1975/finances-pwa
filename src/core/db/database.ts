/**
 * Obertura de la base de dades IndexedDB.
 * Especificació física: disseny-fisic-indexeddb.md
 */

export const DB_NAME = 'finances';
export const DB_VERSION = 1;

export const STORES = {
  accounts: 'accounts',
  transactions: 'transactions',
  categories: 'categories',
  budgets: 'budgets',
  recurringTransactions: 'recurringTransactions',
  tags: 'tags',
  attachments: 'attachments',
  metadata: 'metadata',
  /**
   * Store fictici, només per a tests del core (IndexedDbAdapter).
   * Permet provar el Repository genèric sense fer servir cap entitat
   * de domini real (Account, Transaction...), tal com es va decidir
   * al pla de tests.
   */
  testEntities: 'testEntities',
} as const;

export type StoreName = (typeof STORES)[keyof typeof STORES];

/**
 * Defineix, per a cada store (excepte metadata, que és clau-valor simple),
 * els índexs que cal crear. keyPath sempre és 'id'.
 */
const STORE_INDEXES: Record<Exclude<StoreName, 'metadata'>, string[]> = {
  accounts: ['updatedAt', 'deletedAt', 'name'],
  transactions: [
    'accountId',
    'categoryId',
    'date',
    'updatedAt',
    'deletedAt',
    'merchant',
  ],
  categories: ['active', 'name', 'updatedAt'],
  budgets: ['categoryId', 'period', 'updatedAt', 'deletedAt'],
  recurringTransactions: [
    'accountId',
    'categoryId',
    'nextDueDate',
    'updatedAt',
    'deletedAt',
  ],
  tags: ['name', 'updatedAt', 'deletedAt'],
  attachments: ['entityType', 'entityId', 'updatedAt', 'deletedAt'],
  testEntities: ['updatedAt', 'deletedAt', 'name'],
};

let dbPromise: Promise<IDBDatabase> | null = null;

/**
 * Obre (o crea, si no existeix) la base de dades `finances`.
 * Memoritza la promesa perquè només hi hagi una connexió oberta
 * durant tota la vida de l'aplicació.
 */
export function openDatabase(): Promise<IDBDatabase> {
  if (dbPromise) {
    return dbPromise;
  }

  dbPromise = new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = request.result;
      const oldVersion = event.oldVersion;
      const upgradeTx = request.transaction!; // sempre present dins onupgradeneeded

      // Estructura incremental des del primer dia: quan aparegui
      // schemaVersion 2, només cal afegir un nou `case` amb la
      // migració corresponent, sense reescriure aquest fitxer.
      switch (oldVersion) {
        case 0:
          createInitialSchema(db, upgradeTx);
          break;
        // case 1:
        //   migrateToV2(db, upgradeTx);
        //   break;
      }
    };

    request.onsuccess = () => {
      resolve(request.result);
    };

    request.onerror = () => {
      dbPromise = null;
      reject(request.error);
    };

    request.onblocked = () => {
      // Una altra pestanya/instància encara té la base de dades oberta
      // amb una versió antiga. No fem res especial per ara (un sol
      // usuari, ús domèstic), però es deixa constància per si cal
      // gestionar-ho explícitament més endavant.
      // eslint-disable-next-line no-console
      console.warn('IndexedDB upgrade blocked: tanca altres pestanyes de la PWA.');
    };
  });

  return dbPromise;
}

/**
 * Migració inicial (oldVersion 0 → 1): crea tots els stores i índexs
 * definits al disseny físic. Futures migracions (createInitialSchema
 * no s'hi toca) tindran el seu propi `case` a onupgradeneeded.
 *
 * `upgradeTx` és la transacció `versionchange` en curs — dins
 * d'onupgradeneeded és l'única transacció vàlida per accedir a stores
 * ja existents; no es pot obrir una transacció nova amb db.transaction().
 */
function createInitialSchema(db: IDBDatabase, upgradeTx: IDBTransaction): void {
  // metadata: clau-valor simple, keyPath 'key', sense índexs.
  if (!db.objectStoreNames.contains(STORES.metadata)) {
    db.createObjectStore(STORES.metadata, { keyPath: 'key' });
  }

  for (const [storeName, indexes] of Object.entries(STORE_INDEXES)) {
    const store = db.objectStoreNames.contains(storeName)
      ? upgradeTx.objectStore(storeName)
      : db.createObjectStore(storeName, { keyPath: 'id' });

    for (const indexName of indexes) {
      ensureIndex(store, indexName, indexName);
    }
  }
}

/**
 * Crea un índex només si encara no existeix. Mai s'assumeix que un
 * índex no hi és — evita ConstraintError en migracions futures que
 * afegeixin índexs a un store ja existent.
 */
function ensureIndex(
  store: IDBObjectStore,
  name: string,
  keyPath: string | string[],
  options?: IDBIndexParameters
): void {
  if (!store.indexNames.contains(name)) {
    store.createIndex(name, keyPath, options);
  }
}

/**
 * Tanca la connexió oberta, si n'hi ha. Útil principalment per a tests,
 * per garantir que cada test parteix d'un estat net.
 */
export async function closeDatabase(): Promise<void> {
  if (!dbPromise) {
    return;
  }
  const db = await dbPromise;
  db.close();
  dbPromise = null;
}

/**
 * Esborra completament la base de dades. Només per a tests.
 */
export async function deleteDatabase(): Promise<void> {
  await closeDatabase();
  await new Promise<void>((resolve, reject) => {
    const request = indexedDB.deleteDatabase(DB_NAME);
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
    request.onblocked = () => resolve(); // no bloquegem tests per això
  });
}
