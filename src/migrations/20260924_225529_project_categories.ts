import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-sqlite'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.run(sql`CREATE TABLE \`projects_categories\` (
  	\`order\` integer NOT NULL,
  	\`parent_id\` integer NOT NULL,
  	\`value\` text,
  	\`id\` integer PRIMARY KEY NOT NULL,
  	FOREIGN KEY (\`parent_id\`) REFERENCES \`projects\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`CREATE INDEX \`projects_categories_order_idx\` ON \`projects_categories\` (\`order\`);`)
  await db.run(sql`CREATE INDEX \`projects_categories_parent_idx\` ON \`projects_categories\` (\`parent_id\`);`)
  await db.run(sql`CREATE TABLE \`_projects_v_version_categories\` (
  	\`order\` integer NOT NULL,
  	\`parent_id\` integer NOT NULL,
  	\`value\` text,
  	\`id\` integer PRIMARY KEY NOT NULL,
  	FOREIGN KEY (\`parent_id\`) REFERENCES \`_projects_v\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`CREATE INDEX \`_projects_v_version_categories_order_idx\` ON \`_projects_v_version_categories\` (\`order\`);`)
  await db.run(sql`CREATE INDEX \`_projects_v_version_categories_parent_idx\` ON \`_projects_v_version_categories\` (\`parent_id\`);`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.run(sql`DROP TABLE \`projects_categories\`;`)
  await db.run(sql`DROP TABLE \`_projects_v_version_categories\`;`)
}
