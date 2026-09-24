import * as migration_20260910_025937_initial from './20260910_025937_initial';
import * as migration_20260910_164133_prefijo_media from './20260910_164133_prefijo_media';
import * as migration_20260910_172428_projects from './20260910_172428_projects';
import * as migration_20260910_221046_proposals from './20260910_221046_proposals';
import * as migration_20260911_151335_propuesta_comparativa from './20260911_151335_propuesta_comparativa';
import * as migration_20260911_162011_auditoria_y_cifras from './20260911_162011_auditoria_y_cifras';
import * as migration_20260911_183048_propuesta_bilingue from './20260911_183048_propuesta_bilingue';
import * as migration_20260921_025843_mcp_api_keys from './20260921_025843_mcp_api_keys';
import * as migration_20260921_030438_mcp_tool_toggles from './20260921_030438_mcp_tool_toggles';
import * as migration_20260921_155324_legal from './20260921_155324_legal';
import * as migration_20260924_225529_project_categories from './20260924_225529_project_categories';
import * as migration_20260924_233622_team_members from './20260924_233622_team_members';

export const migrations = [
  {
    up: migration_20260910_025937_initial.up,
    down: migration_20260910_025937_initial.down,
    name: '20260910_025937_initial',
  },
  {
    up: migration_20260910_164133_prefijo_media.up,
    down: migration_20260910_164133_prefijo_media.down,
    name: '20260910_164133_prefijo_media',
  },
  {
    up: migration_20260910_172428_projects.up,
    down: migration_20260910_172428_projects.down,
    name: '20260910_172428_projects',
  },
  {
    up: migration_20260910_221046_proposals.up,
    down: migration_20260910_221046_proposals.down,
    name: '20260910_221046_proposals',
  },
  {
    up: migration_20260911_151335_propuesta_comparativa.up,
    down: migration_20260911_151335_propuesta_comparativa.down,
    name: '20260911_151335_propuesta_comparativa',
  },
  {
    up: migration_20260911_162011_auditoria_y_cifras.up,
    down: migration_20260911_162011_auditoria_y_cifras.down,
    name: '20260911_162011_auditoria_y_cifras',
  },
  {
    up: migration_20260911_183048_propuesta_bilingue.up,
    down: migration_20260911_183048_propuesta_bilingue.down,
    name: '20260911_183048_propuesta_bilingue',
  },
  {
    up: migration_20260921_025843_mcp_api_keys.up,
    down: migration_20260921_025843_mcp_api_keys.down,
    name: '20260921_025843_mcp_api_keys',
  },
  {
    up: migration_20260921_030438_mcp_tool_toggles.up,
    down: migration_20260921_030438_mcp_tool_toggles.down,
    name: '20260921_030438_mcp_tool_toggles',
  },
  {
    up: migration_20260921_155324_legal.up,
    down: migration_20260921_155324_legal.down,
    name: '20260921_155324_legal',
  },
  {
    up: migration_20260924_225529_project_categories.up,
    down: migration_20260924_225529_project_categories.down,
    name: '20260924_225529_project_categories',
  },
  {
    up: migration_20260924_233622_team_members.up,
    down: migration_20260924_233622_team_members.down,
    name: '20260924_233622_team_members'
  },
];
