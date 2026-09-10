import * as migration_20260910_025937_initial from './20260910_025937_initial';
import * as migration_20260910_164133_prefijo_media from './20260910_164133_prefijo_media';

export const migrations = [
  {
    up: migration_20260910_025937_initial.up,
    down: migration_20260910_025937_initial.down,
    name: '20260910_025937_initial',
  },
  {
    up: migration_20260910_164133_prefijo_media.up,
    down: migration_20260910_164133_prefijo_media.down,
    name: '20260910_164133_prefijo_media'
  },
];
