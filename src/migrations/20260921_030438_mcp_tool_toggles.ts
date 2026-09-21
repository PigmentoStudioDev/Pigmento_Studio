import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-sqlite'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.run(sql`ALTER TABLE \`payload_mcp_api_keys\` ADD \`payload_mcp_tool_pigmento_upload_media\` integer DEFAULT true;`)
  await db.run(sql`ALTER TABLE \`payload_mcp_api_keys\` ADD \`payload_mcp_resource_cms_guia\` integer DEFAULT true;`)
  await db.run(sql`ALTER TABLE \`payload_mcp_api_keys\` ADD \`payload_mcp_resource_cms_media\` integer DEFAULT true;`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.run(sql`ALTER TABLE \`payload_mcp_api_keys\` DROP COLUMN \`payload_mcp_tool_pigmento_upload_media\`;`)
  await db.run(sql`ALTER TABLE \`payload_mcp_api_keys\` DROP COLUMN \`payload_mcp_resource_cms_guia\`;`)
  await db.run(sql`ALTER TABLE \`payload_mcp_api_keys\` DROP COLUMN \`payload_mcp_resource_cms_media\`;`)
}
