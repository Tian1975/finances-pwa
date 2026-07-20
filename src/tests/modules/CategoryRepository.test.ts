import { describe, it, expect, beforeEach, afterAll } from 'vitest';
import { CategoryRepository } from '../../modules/categories/CategoryRepository';
import { deleteDatabase } from '../../core/db/database';

describe('CategoryRepository', () => {
  let repository: CategoryRepository;

  beforeEach(async () => {
    await deleteDatabase();
    repository = new CategoryRepository();
  });

  afterAll(async () => {
    await deleteDatabase();
  });

  it('crea una categoria activa per defecte', async () => {
    const category = await repository.add({
      name: 'Alimentació',
      icon: null,
      active: true,
    });

    expect(category.name).toBe('Alimentació');
    expect(category.active).toBe(true);
  });

  it('delete() desactiva la categoria (active: false) en lloc de fer soft delete', async () => {
    const category = await repository.add({
      name: 'Restaurants',
      icon: null,
      active: true,
    });

    await repository.delete(category.id);

    const found = await repository.findById(category.id);
    expect(found).not.toBeNull();
    expect(found?.active).toBe(false);
  });

  it('una categoria desactivada continua apareixent a findAll() (mai s\'esborra)', async () => {
    const category = await repository.add({
      name: 'Antiga',
      icon: null,
      active: true,
    });
    await repository.delete(category.id);

    const all = await repository.findAll();

    expect(all).toHaveLength(1);
    expect(all[0].id).toBe(category.id);
  });

  it('reactivate() torna a activar una categoria desactivada', async () => {
    const category = await repository.add({
      name: 'Oci',
      icon: null,
      active: true,
    });
    await repository.delete(category.id);

    const reactivated = await repository.reactivate(category.id);

    expect(reactivated.active).toBe(true);
  });

  it('findAll() amb where: { active: true } filtra només les actives', async () => {
    const a = await repository.add({ name: 'Activa', icon: null, active: true });
    const b = await repository.add({ name: 'Inactiva', icon: null, active: true });
    await repository.delete(b.id);

    const actives = await repository.findAll({ where: { active: true } });

    expect(actives).toHaveLength(1);
    expect(actives[0].id).toBe(a.id);
  });
});
