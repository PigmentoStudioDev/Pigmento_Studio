import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-sqlite'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.run(sql`CREATE TABLE \`proposals_findings\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`id\` text PRIMARY KEY NOT NULL,
  	\`key\` text,
  	\`area\` text NOT NULL,
  	\`title\` text NOT NULL,
  	\`cost\` text NOT NULL,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`proposals\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`CREATE INDEX \`proposals_findings_order_idx\` ON \`proposals_findings\` (\`_order\`);`)
  await db.run(sql`CREATE INDEX \`proposals_findings_parent_id_idx\` ON \`proposals_findings\` (\`_parent_id\`);`)
  await db.run(sql`CREATE TABLE \`proposals_figures\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`id\` text PRIMARY KEY NOT NULL,
  	\`value\` text NOT NULL,
  	\`label\` text NOT NULL,
  	\`source\` text NOT NULL,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`proposals\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`CREATE INDEX \`proposals_figures_order_idx\` ON \`proposals_figures\` (\`_order\`);`)
  await db.run(sql`CREATE INDEX \`proposals_figures_parent_id_idx\` ON \`proposals_figures\` (\`_parent_id\`);`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.run(sql`DROP TABLE \`proposals_findings\`;`)
  await db.run(sql`DROP TABLE \`proposals_figures\`;`)
}
