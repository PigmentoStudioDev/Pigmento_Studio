import { beforeEach, describe, expect, it, vi } from 'vitest';

const revalidatePath = vi.fn();
vi.mock('next/cache', () => ({ revalidatePath: (...args: unknown[]) => revalidatePath(...args) }));

const { revalidateAfterChange, revalidateAfterDelete } = await import('./revalidate');

describe('revalidate hooks', () => {
  beforeEach(() => {
    revalidatePath.mockReset();
    vi.spyOn(console, 'warn').mockImplementation(() => {});
  });

  it('invalida el layout del idioma y devuelve el documento', async () => {
    const doc = { id: 1 };
    const result = await revalidateAfterChange()({ doc } as never);

    expect(revalidatePath).toHaveBeenCalledWith('/[locale]', 'layout');
    expect(result).toBe(doc);
  });

  it('invalida tambien las rutas extra, y al borrar', async () => {
    await revalidateAfterDelete(['/sitemap.xml'])({ doc: {} } as never);

    expect(revalidatePath).toHaveBeenCalledWith('/sitemap.xml');
  });

  it('no rompe el guardado si no hay contexto de Next', async () => {
    revalidatePath.mockImplementation(() => {
      throw new Error('static generation store missing');
    });

    expect(await revalidateAfterChange()({ doc: { id: 1 } } as never)).toEqual({ id: 1 });
  });
});
