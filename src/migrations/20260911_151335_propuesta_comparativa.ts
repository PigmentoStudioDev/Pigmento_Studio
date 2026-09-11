import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-sqlite'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.run(sql`CREATE TABLE \`proposals_deliverables\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`id\` text PRIMARY KEY NOT NULL,
  	\`name\` text NOT NULL,
  	\`description\` text NOT NULL,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`proposals\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`CREATE INDEX \`proposals_deliverables_order_idx\` ON \`proposals_deliverables\` (\`_order\`);`)
  await db.run(sql`CREATE INDEX \`proposals_deliverables_parent_id_idx\` ON \`proposals_deliverables\` (\`_parent_id\`);`)
  await db.run(sql`CREATE TABLE \`proposals_criteria\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`id\` text PRIMARY KEY NOT NULL,
  	\`label\` text NOT NULL,
  	\`key\` text,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`proposals\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`CREATE INDEX \`proposals_criteria_order_idx\` ON \`proposals_criteria\` (\`_order\`);`)
  await db.run(sql`CREATE INDEX \`proposals_criteria_parent_id_idx\` ON \`proposals_criteria\` (\`_parent_id\`);`)
  await db.run(sql`CREATE TABLE \`proposals_packages_values\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` text NOT NULL,
  	\`id\` text PRIMARY KEY NOT NULL,
  	\`key\` text,
  	\`value\` text,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`proposals_packages\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`CREATE INDEX \`proposals_packages_values_order_idx\` ON \`proposals_packages_values\` (\`_order\`);`)
  await db.run(sql`CREATE INDEX \`proposals_packages_values_parent_id_idx\` ON \`proposals_packages_values\` (\`_parent_id\`);`)
  await db.run(sql`CREATE TABLE \`proposals_packages\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`id\` text PRIMARY KEY NOT NULL,
  	\`name\` text NOT NULL,
  	\`accent\` text DEFAULT 'uno' NOT NULL,
  	\`price_kind\` text DEFAULT 'fijo' NOT NULL,
  	\`amount_cents\` numeric NOT NULL,
  	\`amount_max_cents\` numeric,
  	\`unit\` text DEFAULT 'proyecto' NOT NULL,
  	\`delivery_weeks\` numeric,
  	\`body\` text,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`proposals\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`CREATE INDEX \`proposals_packages_order_idx\` ON \`proposals_packages\` (\`_order\`);`)
  await db.run(sql`CREATE INDEX \`proposals_packages_parent_id_idx\` ON \`proposals_packages\` (\`_parent_id\`);`)
  await db.run(sql`CREATE TABLE \`proposals_add_ons\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`id\` text PRIMARY KEY NOT NULL,
  	\`name\` text NOT NULL,
  	\`price_kind\` text DEFAULT 'fijo' NOT NULL,
  	\`amount_cents\` numeric NOT NULL,
  	\`amount_max_cents\` numeric,
  	\`unit\` text DEFAULT 'proyecto' NOT NULL,
  	\`description\` text NOT NULL,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`proposals\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`CREATE INDEX \`proposals_add_ons_order_idx\` ON \`proposals_add_ons\` (\`_order\`);`)
  await db.run(sql`CREATE INDEX \`proposals_add_ons_parent_id_idx\` ON \`proposals_add_ons\` (\`_parent_id\`);`)
  await db.run(sql`CREATE TABLE \`proposals_terms\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`id\` text PRIMARY KEY NOT NULL,
  	\`label\` text NOT NULL,
  	\`value\` text NOT NULL,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`proposals\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`CREATE INDEX \`proposals_terms_order_idx\` ON \`proposals_terms\` (\`_order\`);`)
  await db.run(sql`CREATE INDEX \`proposals_terms_parent_id_idx\` ON \`proposals_terms\` (\`_parent_id\`);`)
  await db.run(sql`ALTER TABLE \`proposals\` ADD \`service_title\` text;`)
  await db.run(sql`ALTER TABLE \`proposals\` ADD \`tagline\` text;`)
  await db.run(sql`ALTER TABLE \`proposals\` ADD \`cover_image_id\` integer REFERENCES media(id);`)
  await db.run(sql`ALTER TABLE \`proposals\` ADD \`headline\` text;`)
  await db.run(sql`ALTER TABLE \`proposals\` ADD \`context\` text;`)
  await db.run(sql`ALTER TABLE \`proposals\` ADD \`base_title\` text DEFAULT 'Lo que incluye';`)
  await db.run(sql`ALTER TABLE \`proposals\` ADD \`included_in_all\` text;`)
  await db.run(sql`ALTER TABLE \`proposals\` ADD \`routes_eyebrow\` text;`)
  await db.run(sql`ALTER TABLE \`proposals\` ADD \`add_ons_title\` text;`)
  await db.run(sql`ALTER TABLE \`proposals\` ADD \`add_ons_intro\` text;`)
  await db.run(sql`ALTER TABLE \`proposals\` ADD \`recommended_package\` text;`)
  await db.run(sql`ALTER TABLE \`proposals\` ADD \`rec_headline\` text;`)
  await db.run(sql`ALTER TABLE \`proposals\` ADD \`rec_body\` text;`)
  await db.run(sql`ALTER TABLE \`proposals\` ADD \`technical_note\` text;`)
  await db.run(sql`ALTER TABLE \`proposals\` ADD \`terms_title\` text DEFAULT 'Siguiente paso';`)
  await db.run(sql`ALTER TABLE \`proposals\` ADD \`closing\` text;`)
  await db.run(sql`CREATE INDEX \`proposals_cover_image_idx\` ON \`proposals\` (\`cover_image_id\`);`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.run(sql`DROP TABLE \`proposals_deliverables\`;`)
  await db.run(sql`DROP TABLE \`proposals_criteria\`;`)
  await db.run(sql`DROP TABLE \`proposals_packages_values\`;`)
  await db.run(sql`DROP TABLE \`proposals_packages\`;`)
  await db.run(sql`DROP TABLE \`proposals_add_ons\`;`)
  await db.run(sql`DROP TABLE \`proposals_terms\`;`)
  await db.run(sql`PRAGMA foreign_keys=OFF;`)
  await db.run(sql`CREATE TABLE \`__new_proposals\` (
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
  await db.run(sql`INSERT INTO \`__new_proposals\`("id", "client", "contact_email", "status", "currency", "valid_until", "access_token", "notes", "updated_at", "created_at") SELECT "id", "client", "contact_email", "status", "currency", "valid_until", "access_token", "notes", "updated_at", "created_at" FROM \`proposals\`;`)
  await db.run(sql`DROP TABLE \`proposals\`;`)
  await db.run(sql`ALTER TABLE \`__new_proposals\` RENAME TO \`proposals\`;`)
  await db.run(sql`PRAGMA foreign_keys=ON;`)
  await db.run(sql`CREATE UNIQUE INDEX \`proposals_access_token_idx\` ON \`proposals\` (\`access_token\`);`)
  await db.run(sql`CREATE INDEX \`proposals_updated_at_idx\` ON \`proposals\` (\`updated_at\`);`)
  await db.run(sql`CREATE INDEX \`proposals_created_at_idx\` ON \`proposals\` (\`created_at\`);`)
}
