import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-sqlite'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.run(sql`CREATE TABLE \`proposals_scope_items\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`id\` text PRIMARY KEY NOT NULL,
  	\`concept\` text NOT NULL,
  	\`detail\` text,
  	\`amount_cents\` numeric NOT NULL,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`proposals\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`CREATE INDEX \`proposals_scope_items_order_idx\` ON \`proposals_scope_items\` (\`_order\`);`)
  await db.run(sql`CREATE INDEX \`proposals_scope_items_parent_id_idx\` ON \`proposals_scope_items\` (\`_parent_id\`);`)
  await db.run(sql`CREATE TABLE \`proposals\` (
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`client\` text NOT NULL,
  	\`contact_email\` text,
  	\`status\` text DEFAULT 'borrador' NOT NULL,
  	\`currency\` text DEFAULT 'MXN' NOT NULL,
  	\`valid_until\` text,
  	\`access_token\` text,
  	\`notes\` text,
  	\`updated_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
  	\`created_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL
  );
  `)
  await db.run(sql`CREATE UNIQUE INDEX \`proposals_access_token_idx\` ON \`proposals\` (\`access_token\`);`)
  await db.run(sql`CREATE INDEX \`proposals_updated_at_idx\` ON \`proposals\` (\`updated_at\`);`)
  await db.run(sql`CREATE INDEX \`proposals_created_at_idx\` ON \`proposals\` (\`created_at\`);`)
  await db.run(sql`ALTER TABLE \`payload_locked_documents_rels\` ADD \`proposals_id\` integer REFERENCES proposals(id);`)
  await db.run(sql`CREATE INDEX \`payload_locked_documents_rels_proposals_id_idx\` ON \`payload_locked_documents_rels\` (\`proposals_id\`);`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.run(sql`DROP TABLE \`proposals_scope_items\`;`)
  await db.run(sql`DROP TABLE \`proposals\`;`)
  await db.run(sql`PRAGMA foreign_keys=OFF;`)
  await db.run(sql`CREATE TABLE \`__new_payload_locked_documents_rels\` (
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`order\` integer,
  	\`parent_id\` integer NOT NULL,
  	\`path\` text NOT NULL,
  	\`users_id\` integer,
  	\`media_id\` integer,
  	\`projects_id\` integer,
  	FOREIGN KEY (\`parent_id\`) REFERENCES \`payload_locked_documents\`(\`id\`) ON UPDATE no action ON DELETE cascade,
  	FOREIGN KEY (\`users_id\`) REFERENCES \`users\`(\`id\`) ON UPDATE no action ON DELETE cascade,
  	FOREIGN KEY (\`media_id\`) REFERENCES \`media\`(\`id\`) ON UPDATE no action ON DELETE cascade,
  	FOREIGN KEY (\`projects_id\`) REFERENCES \`projects\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`INSERT INTO \`__new_payload_locked_documents_rels\`("id", "order", "parent_id", "path", "users_id", "media_id", "projects_id") SELECT "id", "order", "parent_id", "path", "users_id", "media_id", "projects_id" FROM \`payload_locked_documents_rels\`;`)
  await db.run(sql`DROP TABLE \`payload_locked_documents_rels\`;`)
  await db.run(sql`ALTER TABLE \`__new_payload_locked_documents_rels\` RENAME TO \`payload_locked_documents_rels\`;`)
  await db.run(sql`PRAGMA foreign_keys=ON;`)
  await db.run(sql`CREATE INDEX \`payload_locked_documents_rels_order_idx\` ON \`payload_locked_documents_rels\` (\`order\`);`)
  await db.run(sql`CREATE INDEX \`payload_locked_documents_rels_parent_idx\` ON \`payload_locked_documents_rels\` (\`parent_id\`);`)
  await db.run(sql`CREATE INDEX \`payload_locked_documents_rels_path_idx\` ON \`payload_locked_documents_rels\` (\`path\`);`)
  await db.run(sql`CREATE INDEX \`payload_locked_documents_rels_users_id_idx\` ON \`payload_locked_documents_rels\` (\`users_id\`);`)
  await db.run(sql`CREATE INDEX \`payload_locked_documents_rels_media_id_idx\` ON \`payload_locked_documents_rels\` (\`media_id\`);`)
  await db.run(sql`CREATE INDEX \`payload_locked_documents_rels_projects_id_idx\` ON \`payload_locked_documents_rels\` (\`projects_id\`);`)
}
