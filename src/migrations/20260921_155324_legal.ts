import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-sqlite'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.run(sql`CREATE TABLE \`legal_sections_items\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` text NOT NULL,
  	\`id\` text PRIMARY KEY NOT NULL,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`legal_sections\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`CREATE INDEX \`legal_sections_items_order_idx\` ON \`legal_sections_items\` (\`_order\`);`)
  await db.run(sql`CREATE INDEX \`legal_sections_items_parent_id_idx\` ON \`legal_sections_items\` (\`_parent_id\`);`)
  await db.run(sql`CREATE TABLE \`legal_sections_items_locales\` (
  	\`text\` text,
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`_locale\` text NOT NULL,
  	\`_parent_id\` text NOT NULL,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`legal_sections_items\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`CREATE UNIQUE INDEX \`legal_sections_items_locales_locale_parent_id_unique\` ON \`legal_sections_items_locales\` (\`_locale\`,\`_parent_id\`);`)
  await db.run(sql`CREATE TABLE \`legal_sections\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`id\` text PRIMARY KEY NOT NULL,
  	\`anchor\` text,
  	\`level\` text DEFAULT '2',
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`legal\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`CREATE INDEX \`legal_sections_order_idx\` ON \`legal_sections\` (\`_order\`);`)
  await db.run(sql`CREATE INDEX \`legal_sections_parent_id_idx\` ON \`legal_sections\` (\`_parent_id\`);`)
  await db.run(sql`CREATE TABLE \`legal_sections_locales\` (
  	\`heading\` text,
  	\`body\` text,
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`_locale\` text NOT NULL,
  	\`_parent_id\` text NOT NULL,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`legal_sections\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`CREATE UNIQUE INDEX \`legal_sections_locales_locale_parent_id_unique\` ON \`legal_sections_locales\` (\`_locale\`,\`_parent_id\`);`)
  await db.run(sql`CREATE TABLE \`legal\` (
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`slug\` text,
  	\`effective_date\` text,
  	\`updated_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
  	\`created_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
  	\`_status\` text DEFAULT 'draft'
  );
  `)
  await db.run(sql`CREATE UNIQUE INDEX \`legal_slug_idx\` ON \`legal\` (\`slug\`);`)
  await db.run(sql`CREATE INDEX \`legal_updated_at_idx\` ON \`legal\` (\`updated_at\`);`)
  await db.run(sql`CREATE INDEX \`legal_created_at_idx\` ON \`legal\` (\`created_at\`);`)
  await db.run(sql`CREATE INDEX \`legal__status_idx\` ON \`legal\` (\`_status\`);`)
  await db.run(sql`CREATE TABLE \`legal_locales\` (
  	\`title\` text,
  	\`intro\` text,
  	\`toc_title\` text DEFAULT 'Contenido',
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`_locale\` text NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`legal\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`CREATE UNIQUE INDEX \`legal_locales_locale_parent_id_unique\` ON \`legal_locales\` (\`_locale\`,\`_parent_id\`);`)
  await db.run(sql`CREATE TABLE \`_legal_v_version_sections_items\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`_uuid\` text,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`_legal_v_version_sections\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`CREATE INDEX \`_legal_v_version_sections_items_order_idx\` ON \`_legal_v_version_sections_items\` (\`_order\`);`)
  await db.run(sql`CREATE INDEX \`_legal_v_version_sections_items_parent_id_idx\` ON \`_legal_v_version_sections_items\` (\`_parent_id\`);`)
  await db.run(sql`CREATE TABLE \`_legal_v_version_sections_items_locales\` (
  	\`text\` text,
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`_locale\` text NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`_legal_v_version_sections_items\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`CREATE UNIQUE INDEX \`_legal_v_version_sections_items_locales_locale_parent_id_uni\` ON \`_legal_v_version_sections_items_locales\` (\`_locale\`,\`_parent_id\`);`)
  await db.run(sql`CREATE TABLE \`_legal_v_version_sections\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`anchor\` text,
  	\`level\` text DEFAULT '2',
  	\`_uuid\` text,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`_legal_v\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`CREATE INDEX \`_legal_v_version_sections_order_idx\` ON \`_legal_v_version_sections\` (\`_order\`);`)
  await db.run(sql`CREATE INDEX \`_legal_v_version_sections_parent_id_idx\` ON \`_legal_v_version_sections\` (\`_parent_id\`);`)
  await db.run(sql`CREATE TABLE \`_legal_v_version_sections_locales\` (
  	\`heading\` text,
  	\`body\` text,
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`_locale\` text NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`_legal_v_version_sections\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`CREATE UNIQUE INDEX \`_legal_v_version_sections_locales_locale_parent_id_unique\` ON \`_legal_v_version_sections_locales\` (\`_locale\`,\`_parent_id\`);`)
  await db.run(sql`CREATE TABLE \`_legal_v\` (
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`parent_id\` integer,
  	\`version_slug\` text,
  	\`version_effective_date\` text,
  	\`version_updated_at\` text,
  	\`version_created_at\` text,
  	\`version__status\` text DEFAULT 'draft',
  	\`created_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
  	\`updated_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
  	\`snapshot\` integer,
  	\`published_locale\` text,
  	\`latest\` integer,
  	FOREIGN KEY (\`parent_id\`) REFERENCES \`legal\`(\`id\`) ON UPDATE no action ON DELETE set null
  );
  `)
  await db.run(sql`CREATE INDEX \`_legal_v_parent_idx\` ON \`_legal_v\` (\`parent_id\`);`)
  await db.run(sql`CREATE INDEX \`_legal_v_version_version_slug_idx\` ON \`_legal_v\` (\`version_slug\`);`)
  await db.run(sql`CREATE INDEX \`_legal_v_version_version_updated_at_idx\` ON \`_legal_v\` (\`version_updated_at\`);`)
  await db.run(sql`CREATE INDEX \`_legal_v_version_version_created_at_idx\` ON \`_legal_v\` (\`version_created_at\`);`)
  await db.run(sql`CREATE INDEX \`_legal_v_version_version__status_idx\` ON \`_legal_v\` (\`version__status\`);`)
  await db.run(sql`CREATE INDEX \`_legal_v_created_at_idx\` ON \`_legal_v\` (\`created_at\`);`)
  await db.run(sql`CREATE INDEX \`_legal_v_updated_at_idx\` ON \`_legal_v\` (\`updated_at\`);`)
  await db.run(sql`CREATE INDEX \`_legal_v_snapshot_idx\` ON \`_legal_v\` (\`snapshot\`);`)
  await db.run(sql`CREATE INDEX \`_legal_v_published_locale_idx\` ON \`_legal_v\` (\`published_locale\`);`)
  await db.run(sql`CREATE INDEX \`_legal_v_latest_idx\` ON \`_legal_v\` (\`latest\`);`)
  await db.run(sql`CREATE TABLE \`_legal_v_locales\` (
  	\`version_title\` text,
  	\`version_intro\` text,
  	\`version_toc_title\` text DEFAULT 'Contenido',
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`_locale\` text NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`_legal_v\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`CREATE UNIQUE INDEX \`_legal_v_locales_locale_parent_id_unique\` ON \`_legal_v_locales\` (\`_locale\`,\`_parent_id\`);`)
  await db.run(sql`ALTER TABLE \`payload_mcp_api_keys\` ADD \`legal_find\` integer DEFAULT false;`)
  await db.run(sql`ALTER TABLE \`payload_mcp_api_keys\` ADD \`legal_create\` integer DEFAULT false;`)
  await db.run(sql`ALTER TABLE \`payload_mcp_api_keys\` ADD \`legal_update\` integer DEFAULT false;`)
  await db.run(sql`ALTER TABLE \`payload_locked_documents_rels\` ADD \`legal_id\` integer REFERENCES legal(id);`)
  await db.run(sql`CREATE INDEX \`payload_locked_documents_rels_legal_id_idx\` ON \`payload_locked_documents_rels\` (\`legal_id\`);`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.run(sql`DROP TABLE \`legal_sections_items\`;`)
  await db.run(sql`DROP TABLE \`legal_sections_items_locales\`;`)
  await db.run(sql`DROP TABLE \`legal_sections\`;`)
  await db.run(sql`DROP TABLE \`legal_sections_locales\`;`)
  await db.run(sql`DROP TABLE \`legal\`;`)
  await db.run(sql`DROP TABLE \`legal_locales\`;`)
  await db.run(sql`DROP TABLE \`_legal_v_version_sections_items\`;`)
  await db.run(sql`DROP TABLE \`_legal_v_version_sections_items_locales\`;`)
  await db.run(sql`DROP TABLE \`_legal_v_version_sections\`;`)
  await db.run(sql`DROP TABLE \`_legal_v_version_sections_locales\`;`)
  await db.run(sql`DROP TABLE \`_legal_v\`;`)
  await db.run(sql`DROP TABLE \`_legal_v_locales\`;`)
  await db.run(sql`PRAGMA foreign_keys=OFF;`)
  await db.run(sql`CREATE TABLE \`__new_payload_locked_documents_rels\` (
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`order\` integer,
  	\`parent_id\` integer NOT NULL,
  	\`path\` text NOT NULL,
  	\`users_id\` integer,
  	\`media_id\` integer,
  	\`projects_id\` integer,
  	\`proposals_id\` integer,
  	\`payload_mcp_api_keys_id\` integer,
  	FOREIGN KEY (\`parent_id\`) REFERENCES \`payload_locked_documents\`(\`id\`) ON UPDATE no action ON DELETE cascade,
  	FOREIGN KEY (\`users_id\`) REFERENCES \`users\`(\`id\`) ON UPDATE no action ON DELETE cascade,
  	FOREIGN KEY (\`media_id\`) REFERENCES \`media\`(\`id\`) ON UPDATE no action ON DELETE cascade,
  	FOREIGN KEY (\`projects_id\`) REFERENCES \`projects\`(\`id\`) ON UPDATE no action ON DELETE cascade,
  	FOREIGN KEY (\`proposals_id\`) REFERENCES \`proposals\`(\`id\`) ON UPDATE no action ON DELETE cascade,
  	FOREIGN KEY (\`payload_mcp_api_keys_id\`) REFERENCES \`payload_mcp_api_keys\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`INSERT INTO \`__new_payload_locked_documents_rels\`("id", "order", "parent_id", "path", "users_id", "media_id", "projects_id", "proposals_id", "payload_mcp_api_keys_id") SELECT "id", "order", "parent_id", "path", "users_id", "media_id", "projects_id", "proposals_id", "payload_mcp_api_keys_id" FROM \`payload_locked_documents_rels\`;`)
  await db.run(sql`DROP TABLE \`payload_locked_documents_rels\`;`)
  await db.run(sql`ALTER TABLE \`__new_payload_locked_documents_rels\` RENAME TO \`payload_locked_documents_rels\`;`)
  await db.run(sql`PRAGMA foreign_keys=ON;`)
  await db.run(sql`CREATE INDEX \`payload_locked_documents_rels_order_idx\` ON \`payload_locked_documents_rels\` (\`order\`);`)
  await db.run(sql`CREATE INDEX \`payload_locked_documents_rels_parent_idx\` ON \`payload_locked_documents_rels\` (\`parent_id\`);`)
  await db.run(sql`CREATE INDEX \`payload_locked_documents_rels_path_idx\` ON \`payload_locked_documents_rels\` (\`path\`);`)
  await db.run(sql`CREATE INDEX \`payload_locked_documents_rels_users_id_idx\` ON \`payload_locked_documents_rels\` (\`users_id\`);`)
  await db.run(sql`CREATE INDEX \`payload_locked_documents_rels_media_id_idx\` ON \`payload_locked_documents_rels\` (\`media_id\`);`)
  await db.run(sql`CREATE INDEX \`payload_locked_documents_rels_projects_id_idx\` ON \`payload_locked_documents_rels\` (\`projects_id\`);`)
  await db.run(sql`CREATE INDEX \`payload_locked_documents_rels_proposals_id_idx\` ON \`payload_locked_documents_rels\` (\`proposals_id\`);`)
  await db.run(sql`CREATE INDEX \`payload_locked_documents_rels_payload_mcp_api_keys_id_idx\` ON \`payload_locked_documents_rels\` (\`payload_mcp_api_keys_id\`);`)
  await db.run(sql`ALTER TABLE \`payload_mcp_api_keys\` DROP COLUMN \`legal_find\`;`)
  await db.run(sql`ALTER TABLE \`payload_mcp_api_keys\` DROP COLUMN \`legal_create\`;`)
  await db.run(sql`ALTER TABLE \`payload_mcp_api_keys\` DROP COLUMN \`legal_update\`;`)
}
