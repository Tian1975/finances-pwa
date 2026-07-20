import { describe, it, expect, beforeEach, afterAll } from 'vitest';
import type { BaseEntity } from '../../core/types/BaseEntity';
import { IndexedDbAdapter } from '../../core/db/IndexedDbAdapter';
import { deleteDatabase, STORES } from '../../core/db/database';

/**
 * Entitat fictícia, sense cap relació amb el domini de finances.
 * L'objectiu és provar que Repository<T> / IndexedDbAdapter<T> és
 * realment genèric: si aquests tests passen amb una entitat inventada,
 * Account, Transaction i Budget seran només instàncies del mateix
 * contracte, ja validat.
 */
interface TestEntity extends BaseEntity {
  name: string;
  value: number;
}

describe('IndexedDbAdapter', () => {
  let repository: IndexedDbAdapter<TestEntity>;

  beforeEach(async () => {
    await deleteDatabase();
    repository = new IndexedDbAdapter<TestEntity>(STORES.testEntities);
  });

  afterAll(async () => {
    await deleteDatabase();
  });

  it('add() crea una entitat amb id, createdAt, updatedAt i deletedAt', async () => {
    const created = await repository.add({ name: 'primer', value: 1 });

    expect(created.id).toBeDefined();
    expect(created.createdAt).toBeDefined();
    expect(created.updatedAt).toBe(created.createdAt);
    expect(created.deletedAt).toBeNull();
    expect(created.name).toBe('primer');
    expect(created.value).toBe(1);
  });

  it('findById() recupera una entitat prèviament creada', async () => {
    const created = await repository.add({ name: 'trobable', value: 2 });

    const found = await repository.findById(created.id);

    expect(found).not.toBeNull();
    expect(found?.id).toBe(created.id);
    expect(found?.name).toBe('trobable');
  });

  it('findById() retorna null si l\'entitat no existeix', async () => {
    const found = await repository.findById('id-inexistent');
    expect(found).toBeNull();
  });

  it('findAll() retorna totes les entitats creades', async () => {
    await repository.add({ name: 'un', value: 1 });
    await repository.add({ name: 'dos', value: 2 });
    await repository.add({ name: 'tres', value: 3 });

    const all = await repository.findAll();

    expect(all).toHaveLength(3);
  });

  it('update() modifica els camps indicats i actualitza updatedAt', async () => {
    const created = await repository.add({ name: 'original', value: 1 });

    // Esperem un instant per garantir que updatedAt canvia de debò.
    await new Promise((resolve) => setTimeout(resolve, 5));

    const updated = await repository.update(created.id, { value: 99 });

    expect(updated.value).toBe(99);
    expect(updated.name).toBe('original'); // camp no tocat es manté
    expect(updated.id).toBe(created.id); // id és immutable
    expect(updated.updatedAt).not.toBe(created.updatedAt);
  });

  it('update() llança un error si l\'entitat no existeix', async () => {
    await expect(
      repository.update('id-inexistent', { value: 1 })
    ).rejects.toThrow();
  });

  it('delete() fa soft delete: marca deletedAt però no esborra el registre', async () => {
    const created = await repository.add({ name: 'esborrable', value: 1 });

    await repository.delete(created.id);

    const found = await repository.findById(created.id);
    expect(found).not.toBeNull();
    expect(found?.deletedAt).not.toBeNull();
  });

  it('upsert() insereix una entitat nova si no existeix', async () => {
    const entity: TestEntity = {
      id: 'upsert-nou',
      name: 'nou',
      value: 1,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      deletedAt: null,
    };

    const result = await repository.upsert(entity);

    expect(result.id).toBe('upsert-nou');
    const found = await repository.findById('upsert-nou');
    expect(found).not.toBeNull();
  });

  it('upsert() actualitza una entitat existent', async () => {
    const created = await repository.add({ name: 'original', value: 1 });

    const result = await repository.upsert({
      ...created,
      value: 42,
    });

    expect(result.value).toBe(42);
    const found = await repository.findById(created.id);
    expect(found?.value).toBe(42);
  });

  it('findUpdatedSince() retorna només les entitats modificades des del timestamp', async () => {
    const before = new Date().toISOString();

    await new Promise((resolve) => setTimeout(resolve, 5));
    const afterFirst = new Date().toISOString();
    await repository.add({ name: 'recent', value: 1 });

    const results = await repository.findUpdatedSince(afterFirst);

    expect(results).toHaveLength(1);
    expect(results[0].name).toBe('recent');

    const allResults = await repository.findUpdatedSince(before);
    expect(allResults).toHaveLength(1);
  });

  it('findAll() amb where filtra per igualtat exacta', async () => {
    await repository.add({ name: 'a', value: 10 });
    await repository.add({ name: 'b', value: 20 });
    await repository.add({ name: 'c', value: 10 });

    const results = await repository.findAll({ where: { value: 10 } });

    expect(results).toHaveLength(2);
    expect(results.every((r) => r.value === 10)).toBe(true);
  });

  it('findAll() amb orderBy i direction ordena els resultats', async () => {
    await repository.add({ name: 'c', value: 3 });
    await repository.add({ name: 'a', value: 1 });
    await repository.add({ name: 'b', value: 2 });

    const ascending = await repository.findAll({ orderBy: 'value', direction: 'asc' });
    expect(ascending.map((r) => r.value)).toEqual([1, 2, 3]);

    const descending = await repository.findAll({ orderBy: 'value', direction: 'desc' });
    expect(descending.map((r) => r.value)).toEqual([3, 2, 1]);
  });

  it('findAll() amb limit talla el nombre de resultats', async () => {
    await repository.add({ name: 'a', value: 1 });
    await repository.add({ name: 'b', value: 2 });
    await repository.add({ name: 'c', value: 3 });

    const results = await repository.findAll({ limit: 2 });

    expect(results).toHaveLength(2);
  });

  it('delete() llança un error si l\'entitat no existeix', async () => {
    await expect(repository.delete('id-inexistent')).rejects.toThrow();
  });

  it('upsert() en inserció preserva els timestamps originals de l\'entitat entrant (cas de sincronització)', async () => {
    const originalCreatedAt = '2026-01-01T10:00:00.000Z';
    const originalUpdatedAt = '2026-01-02T10:00:00.000Z';

    const entity: TestEntity = {
      id: 'sync-entity',
      name: 'vingut de fora',
      value: 1,
      createdAt: originalCreatedAt,
      updatedAt: originalUpdatedAt,
      deletedAt: null,
    };

    const result = await repository.upsert(entity);

    // No s'ha de regenerar createdAt/updatedAt com faria add(): els
    // timestamps formen part de les dades sincronitzades.
    expect(result.createdAt).toBe(originalCreatedAt);
    expect(result.updatedAt).toBe(originalUpdatedAt);

    const found = await repository.findById('sync-entity');
    expect(found?.createdAt).toBe(originalCreatedAt);
    expect(found?.updatedAt).toBe(originalUpdatedAt);
  });

  it('findAll() continua retornant entitats amb soft delete (filtrar-les és responsabilitat d\'una capa superior)', async () => {
    const created = await repository.add({ name: 'esborrable', value: 1 });
    await repository.delete(created.id);

    const all = await repository.findAll();

    expect(all).toHaveLength(1);
    expect(all[0].deletedAt).not.toBeNull();
  });

  it('findAll() combina where, orderBy i limit alhora', async () => {
    await repository.add({ name: 'a', value: 10 });
    await repository.add({ name: 'b', value: 20 });
    await repository.add({ name: 'c', value: 10 });
    await repository.add({ name: 'd', value: 10 });

    const results = await repository.findAll({
      where: { value: 10 },
      orderBy: 'name',
      direction: 'desc',
      limit: 2,
    });

    expect(results).toHaveLength(2);
    expect(results.every((r) => r.value === 10)).toBe(true);
    expect(results.map((r) => r.name)).toEqual(['d', 'c']);
  });
});
