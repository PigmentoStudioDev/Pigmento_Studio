import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-sqlite'

/**
 * La propuesta pasa a ser bilingue: cada hoja de texto se muda a una tabla
 * `_locales`, y la ruta recomendada deja de atarse por nombre para atarse por clave.
 *
 * **Esta migracion esta EDITADA A MANO y no debe regenerarse.** Lo que genera
 * `migrate:create` crea las tablas nuevas y a continuacion tira las 32 columnas
 * viejas sin copiar nada: aplicada tal cual, la propuesta que ya esta en produccion
 * se queda sin una sola linea de texto. Los dos bloques marcados abajo son lo que
 * se anadio, y van entre la creacion y los DROP porque despues del DROP ya no hay
 * de donde copiar.
 */

/**
 * La clave a partir del nombre.
 *
 * Es una COPIA de `criterionKey` de la coleccion, y la duplicacion es deliberada:
 * una migracion es un artefacto congelado en el tiempo. Si manana la coleccion
 * cambia como deriva sus claves, esta migracion tiene que seguir produciendo las
 * que produjo el dia que corrio, o la base deja de casar consigo misma.
 *
 * Se deriva en JS y no en SQL porque quitar acentos es normalizacion NFD, y SQLite
 * no normaliza: `lower()` solo baja ASCII.
 */
function clave(texto: string): string {
  return texto
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

/** Las filas de un SELECT, sea cual sea la forma en que las devuelva el driver. */
function filas<T>(resultado: unknown): T[] {
  return ((resultado as { rows?: T[] })?.rows ?? []) as T[]
}

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.run(sql`CREATE TABLE \`proposals_findings_locales\` (
  	\`area\` text NOT NULL,
  	\`title\` text NOT NULL,
  	\`cost\` text NOT NULL,
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`_locale\` text NOT NULL,
  	\`_parent_id\` text NOT NULL,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`proposals_findings\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`CREATE UNIQUE INDEX \`proposals_findings_locales_locale_parent_id_unique\` ON \`proposals_findings_locales\` (\`_locale\`,\`_parent_id\`);`)
  await db.run(sql`CREATE TABLE \`proposals_figures_locales\` (
  	\`label\` text NOT NULL,
  	\`source\` text NOT NULL,
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`_locale\` text NOT NULL,
  	\`_parent_id\` text NOT NULL,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`proposals_figures\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`CREATE UNIQUE INDEX \`proposals_figures_locales_locale_parent_id_unique\` ON \`proposals_figures_locales\` (\`_locale\`,\`_parent_id\`);`)
  await db.run(sql`CREATE TABLE \`proposals_deliverables_locales\` (
  	\`name\` text NOT NULL,
  	\`description\` text NOT NULL,
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`_locale\` text NOT NULL,
  	\`_parent_id\` text NOT NULL,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`proposals_deliverables\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`CREATE UNIQUE INDEX \`proposals_deliverables_locales_locale_parent_id_unique\` ON \`proposals_deliverables_locales\` (\`_locale\`,\`_parent_id\`);`)
  await db.run(sql`CREATE TABLE \`proposals_criteria_locales\` (
  	\`label\` text NOT NULL,
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`_locale\` text NOT NULL,
  	\`_parent_id\` text NOT NULL,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`proposals_criteria\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`CREATE UNIQUE INDEX \`proposals_criteria_locales_locale_parent_id_unique\` ON \`proposals_criteria_locales\` (\`_locale\`,\`_parent_id\`);`)
  await db.run(sql`CREATE TABLE \`proposals_packages_values_locales\` (
  	\`value\` text,
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`_locale\` text NOT NULL,
  	\`_parent_id\` text NOT NULL,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`proposals_packages_values\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`CREATE UNIQUE INDEX \`proposals_packages_values_locales_locale_parent_id_unique\` ON \`proposals_packages_values_locales\` (\`_locale\`,\`_parent_id\`);`)
  await db.run(sql`CREATE TABLE \`proposals_packages_locales\` (
  	\`name\` text NOT NULL,
  	\`body\` text,
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`_locale\` text NOT NULL,
  	\`_parent_id\` text NOT NULL,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`proposals_packages\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`CREATE UNIQUE INDEX \`proposals_packages_locales_locale_parent_id_unique\` ON \`proposals_packages_locales\` (\`_locale\`,\`_parent_id\`);`)
  await db.run(sql`CREATE TABLE \`proposals_add_ons_locales\` (
  	\`name\` text NOT NULL,
  	\`description\` text NOT NULL,
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`_locale\` text NOT NULL,
  	\`_parent_id\` text NOT NULL,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`proposals_add_ons\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`CREATE UNIQUE INDEX \`proposals_add_ons_locales_locale_parent_id_unique\` ON \`proposals_add_ons_locales\` (\`_locale\`,\`_parent_id\`);`)
  await db.run(sql`CREATE TABLE \`proposals_terms_locales\` (
  	\`label\` text NOT NULL,
  	\`value\` text NOT NULL,
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`_locale\` text NOT NULL,
  	\`_parent_id\` text NOT NULL,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`proposals_terms\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`CREATE UNIQUE INDEX \`proposals_terms_locales_locale_parent_id_unique\` ON \`proposals_terms_locales\` (\`_locale\`,\`_parent_id\`);`)
  await db.run(sql`CREATE TABLE \`proposals_scope_items_locales\` (
  	\`concept\` text NOT NULL,
  	\`detail\` text,
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`_locale\` text NOT NULL,
  	\`_parent_id\` text NOT NULL,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`proposals_scope_items\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`CREATE UNIQUE INDEX \`proposals_scope_items_locales_locale_parent_id_unique\` ON \`proposals_scope_items_locales\` (\`_locale\`,\`_parent_id\`);`)
  await db.run(sql`CREATE TABLE \`proposals_locales\` (
  	\`service_title\` text,
  	\`tagline\` text,
  	\`headline\` text,
  	\`context\` text,
  	\`base_title\` text DEFAULT 'Lo que incluye',
  	\`included_in_all\` text,
  	\`routes_eyebrow\` text,
  	\`add_ons_title\` text,
  	\`add_ons_intro\` text,
  	\`rec_headline\` text,
  	\`rec_body\` text,
  	\`technical_note\` text,
  	\`terms_title\` text DEFAULT 'Siguiente paso',
  	\`closing\` text,
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`_locale\` text NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`proposals\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`CREATE UNIQUE INDEX \`proposals_locales_locale_parent_id_unique\` ON \`proposals_locales\` (\`_locale\`,\`_parent_id\`);`)
  await db.run(sql`ALTER TABLE \`proposals_packages\` ADD \`key\` text;`)

  // ─── anadido a mano: el contenido de hoy pasa a ser el del locale 'es' ───
  //
  // Va ANTES de los DROP, que es el unico momento en que existen las dos formas a
  // la vez. `id` se omite en cada INSERT: es INTEGER PRIMARY KEY y SQLite lo asigna.
  await db.run(sql`INSERT INTO \`proposals_locales\` (\`service_title\`,\`tagline\`,\`headline\`,\`context\`,\`base_title\`,\`included_in_all\`,\`routes_eyebrow\`,\`add_ons_title\`,\`add_ons_intro\`,\`rec_headline\`,\`rec_body\`,\`technical_note\`,\`terms_title\`,\`closing\`,\`_locale\`,\`_parent_id\`) SELECT \`service_title\`,\`tagline\`,\`headline\`,\`context\`,\`base_title\`,\`included_in_all\`,\`routes_eyebrow\`,\`add_ons_title\`,\`add_ons_intro\`,\`rec_headline\`,\`rec_body\`,\`technical_note\`,\`terms_title\`,\`closing\`,'es',\`id\` FROM \`proposals\`;`)
  await db.run(sql`INSERT INTO \`proposals_findings_locales\` (\`area\`,\`title\`,\`cost\`,\`_locale\`,\`_parent_id\`) SELECT \`area\`,\`title\`,\`cost\`,'es',\`id\` FROM \`proposals_findings\`;`)
  await db.run(sql`INSERT INTO \`proposals_figures_locales\` (\`label\`,\`source\`,\`_locale\`,\`_parent_id\`) SELECT \`label\`,\`source\`,'es',\`id\` FROM \`proposals_figures\`;`)
  await db.run(sql`INSERT INTO \`proposals_deliverables_locales\` (\`name\`,\`description\`,\`_locale\`,\`_parent_id\`) SELECT \`name\`,\`description\`,'es',\`id\` FROM \`proposals_deliverables\`;`)
  await db.run(sql`INSERT INTO \`proposals_criteria_locales\` (\`label\`,\`_locale\`,\`_parent_id\`) SELECT \`label\`,'es',\`id\` FROM \`proposals_criteria\`;`)
  await db.run(sql`INSERT INTO \`proposals_packages_locales\` (\`name\`,\`body\`,\`_locale\`,\`_parent_id\`) SELECT \`name\`,\`body\`,'es',\`id\` FROM \`proposals_packages\`;`)
  await db.run(sql`INSERT INTO \`proposals_packages_values_locales\` (\`value\`,\`_locale\`,\`_parent_id\`) SELECT \`value\`,'es',\`id\` FROM \`proposals_packages_values\`;`)
  await db.run(sql`INSERT INTO \`proposals_add_ons_locales\` (\`name\`,\`description\`,\`_locale\`,\`_parent_id\`) SELECT \`name\`,\`description\`,'es',\`id\` FROM \`proposals_add_ons\`;`)
  await db.run(sql`INSERT INTO \`proposals_terms_locales\` (\`label\`,\`value\`,\`_locale\`,\`_parent_id\`) SELECT \`label\`,\`value\`,'es',\`id\` FROM \`proposals_terms\`;`)
  await db.run(sql`INSERT INTO \`proposals_scope_items_locales\` (\`concept\`,\`detail\`,\`_locale\`,\`_parent_id\`) SELECT \`concept\`,\`detail\`,'es',\`id\` FROM \`proposals_scope_items\`;`)

  // ─── anadido a mano: la clave de cada ruta, y la recomendada por clave ───
  //
  // Tambien antes de los DROP: se deriva de `name`, que esta a punto de irse. Sin
  // esto, la insignia "Recomendada" se apaga en la propuesta que ya esta viva —
  // sin error y sin hueco, que es como no se nota.
  const rutas = filas<{ id: string; name: string }>(
    await db.run(sql`SELECT \`id\`, \`name\` FROM \`proposals_packages\`;`),
  )
  for (const ruta of rutas) {
    await db.run(sql`UPDATE \`proposals_packages\` SET \`key\` = ${clave(ruta.name)} WHERE \`id\` = ${ruta.id};`)
  }

  const recomendadas = filas<{ id: number; recommended_package: string | null }>(
    await db.run(sql`SELECT \`id\`, \`recommended_package\` FROM \`proposals\` WHERE \`recommended_package\` IS NOT NULL;`),
  )
  for (const propuesta of recomendadas) {
    if (!propuesta.recommended_package) continue
    await db.run(sql`UPDATE \`proposals\` SET \`recommended_package\` = ${clave(propuesta.recommended_package)} WHERE \`id\` = ${propuesta.id};`)
  }
  // ─── fin de lo anadido a mano ───
  await db.run(sql`ALTER TABLE \`proposals_packages\` DROP COLUMN \`name\`;`)
  await db.run(sql`ALTER TABLE \`proposals_packages\` DROP COLUMN \`body\`;`)
  await db.run(sql`ALTER TABLE \`proposals_findings\` DROP COLUMN \`area\`;`)
  await db.run(sql`ALTER TABLE \`proposals_findings\` DROP COLUMN \`title\`;`)
  await db.run(sql`ALTER TABLE \`proposals_findings\` DROP COLUMN \`cost\`;`)
  await db.run(sql`ALTER TABLE \`proposals_figures\` DROP COLUMN \`label\`;`)
  await db.run(sql`ALTER TABLE \`proposals_figures\` DROP COLUMN \`source\`;`)
  await db.run(sql`ALTER TABLE \`proposals_deliverables\` DROP COLUMN \`name\`;`)
  await db.run(sql`ALTER TABLE \`proposals_deliverables\` DROP COLUMN \`description\`;`)
  await db.run(sql`ALTER TABLE \`proposals_criteria\` DROP COLUMN \`label\`;`)
  await db.run(sql`ALTER TABLE \`proposals_packages_values\` DROP COLUMN \`value\`;`)
  await db.run(sql`ALTER TABLE \`proposals_add_ons\` DROP COLUMN \`name\`;`)
  await db.run(sql`ALTER TABLE \`proposals_add_ons\` DROP COLUMN \`description\`;`)
  await db.run(sql`ALTER TABLE \`proposals_terms\` DROP COLUMN \`label\`;`)
  await db.run(sql`ALTER TABLE \`proposals_terms\` DROP COLUMN \`value\`;`)
  await db.run(sql`ALTER TABLE \`proposals_scope_items\` DROP COLUMN \`concept\`;`)
  await db.run(sql`ALTER TABLE \`proposals_scope_items\` DROP COLUMN \`detail\`;`)
  await db.run(sql`ALTER TABLE \`proposals\` DROP COLUMN \`service_title\`;`)
  await db.run(sql`ALTER TABLE \`proposals\` DROP COLUMN \`tagline\`;`)
  await db.run(sql`ALTER TABLE \`proposals\` DROP COLUMN \`headline\`;`)
  await db.run(sql`ALTER TABLE \`proposals\` DROP COLUMN \`context\`;`)
  await db.run(sql`ALTER TABLE \`proposals\` DROP COLUMN \`base_title\`;`)
  await db.run(sql`ALTER TABLE \`proposals\` DROP COLUMN \`included_in_all\`;`)
  await db.run(sql`ALTER TABLE \`proposals\` DROP COLUMN \`routes_eyebrow\`;`)
  await db.run(sql`ALTER TABLE \`proposals\` DROP COLUMN \`add_ons_title\`;`)
  await db.run(sql`ALTER TABLE \`proposals\` DROP COLUMN \`add_ons_intro\`;`)
  await db.run(sql`ALTER TABLE \`proposals\` DROP COLUMN \`rec_headline\`;`)
  await db.run(sql`ALTER TABLE \`proposals\` DROP COLUMN \`rec_body\`;`)
  await db.run(sql`ALTER TABLE \`proposals\` DROP COLUMN \`technical_note\`;`)
  await db.run(sql`ALTER TABLE \`proposals\` DROP COLUMN \`terms_title\`;`)
  await db.run(sql`ALTER TABLE \`proposals\` DROP COLUMN \`closing\`;`)
}

/**
 * La vuelta atras, tambien EDITADA A MANO.
 *
 * La que se generaba no podia correr: tiraba primero las tablas `_locales` —el
 * unico sitio donde a estas alturas vive el texto— y luego anadia las columnas con
 * NOT NULL, cosa que SQLite rechaza sobre una tabla que ya tiene filas. Aqui el
 * orden es el inverso: se crean las columnas, se recupera de ellas el locale 'es',
 * y solo entonces se tiran las tablas.
 *
 * Las columnas vuelven SIN `NOT NULL`. Reponerlo en SQLite pide reconstruir cada
 * tabla entera, y una restriccion perdida en un rollback es mucho menos grave que
 * un rollback que no se puede ejecutar. Si esta vuelta llega a usarse de verdad,
 * lo que toca despues es regenerar el esquema desde el config, no parchear esto.
 */
export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.run(sql`ALTER TABLE \`proposals\` ADD \`service_title\` text;`)
  await db.run(sql`ALTER TABLE \`proposals\` ADD \`tagline\` text;`)
  await db.run(sql`ALTER TABLE \`proposals\` ADD \`headline\` text;`)
  await db.run(sql`ALTER TABLE \`proposals\` ADD \`context\` text;`)
  await db.run(sql`ALTER TABLE \`proposals\` ADD \`base_title\` text DEFAULT 'Lo que incluye';`)
  await db.run(sql`ALTER TABLE \`proposals\` ADD \`included_in_all\` text;`)
  await db.run(sql`ALTER TABLE \`proposals\` ADD \`routes_eyebrow\` text;`)
  await db.run(sql`ALTER TABLE \`proposals\` ADD \`add_ons_title\` text;`)
  await db.run(sql`ALTER TABLE \`proposals\` ADD \`add_ons_intro\` text;`)
  await db.run(sql`ALTER TABLE \`proposals\` ADD \`rec_headline\` text;`)
  await db.run(sql`ALTER TABLE \`proposals\` ADD \`rec_body\` text;`)
  await db.run(sql`ALTER TABLE \`proposals\` ADD \`technical_note\` text;`)
  await db.run(sql`ALTER TABLE \`proposals\` ADD \`terms_title\` text DEFAULT 'Siguiente paso';`)
  await db.run(sql`ALTER TABLE \`proposals\` ADD \`closing\` text;`)
  await db.run(sql`ALTER TABLE \`proposals_findings\` ADD \`area\` text;`)
  await db.run(sql`ALTER TABLE \`proposals_findings\` ADD \`title\` text;`)
  await db.run(sql`ALTER TABLE \`proposals_findings\` ADD \`cost\` text;`)
  await db.run(sql`ALTER TABLE \`proposals_figures\` ADD \`label\` text;`)
  await db.run(sql`ALTER TABLE \`proposals_figures\` ADD \`source\` text;`)
  await db.run(sql`ALTER TABLE \`proposals_deliverables\` ADD \`name\` text;`)
  await db.run(sql`ALTER TABLE \`proposals_deliverables\` ADD \`description\` text;`)
  await db.run(sql`ALTER TABLE \`proposals_criteria\` ADD \`label\` text;`)
  await db.run(sql`ALTER TABLE \`proposals_packages\` ADD \`name\` text;`)
  await db.run(sql`ALTER TABLE \`proposals_packages\` ADD \`body\` text;`)
  await db.run(sql`ALTER TABLE \`proposals_packages_values\` ADD \`value\` text;`)
  await db.run(sql`ALTER TABLE \`proposals_add_ons\` ADD \`name\` text;`)
  await db.run(sql`ALTER TABLE \`proposals_add_ons\` ADD \`description\` text;`)
  await db.run(sql`ALTER TABLE \`proposals_terms\` ADD \`label\` text;`)
  await db.run(sql`ALTER TABLE \`proposals_terms\` ADD \`value\` text;`)
  await db.run(sql`ALTER TABLE \`proposals_scope_items\` ADD \`concept\` text;`)
  await db.run(sql`ALTER TABLE \`proposals_scope_items\` ADD \`detail\` text;`)

  // Se recupera el locale por defecto. Lo que se hubiera escrito en ingles se
  // pierde aqui: en el esquema de vuelta no hay sitio donde ponerlo.
  await db.run(sql`UPDATE \`proposals\` SET \`service_title\` = (SELECT \`service_title\` FROM \`proposals_locales\` l WHERE l.\`_parent_id\` = \`proposals\`.\`id\` AND l.\`_locale\` = 'es'), \`tagline\` = (SELECT \`tagline\` FROM \`proposals_locales\` l WHERE l.\`_parent_id\` = \`proposals\`.\`id\` AND l.\`_locale\` = 'es'), \`headline\` = (SELECT \`headline\` FROM \`proposals_locales\` l WHERE l.\`_parent_id\` = \`proposals\`.\`id\` AND l.\`_locale\` = 'es'), \`context\` = (SELECT \`context\` FROM \`proposals_locales\` l WHERE l.\`_parent_id\` = \`proposals\`.\`id\` AND l.\`_locale\` = 'es'), \`base_title\` = (SELECT \`base_title\` FROM \`proposals_locales\` l WHERE l.\`_parent_id\` = \`proposals\`.\`id\` AND l.\`_locale\` = 'es'), \`included_in_all\` = (SELECT \`included_in_all\` FROM \`proposals_locales\` l WHERE l.\`_parent_id\` = \`proposals\`.\`id\` AND l.\`_locale\` = 'es'), \`routes_eyebrow\` = (SELECT \`routes_eyebrow\` FROM \`proposals_locales\` l WHERE l.\`_parent_id\` = \`proposals\`.\`id\` AND l.\`_locale\` = 'es'), \`add_ons_title\` = (SELECT \`add_ons_title\` FROM \`proposals_locales\` l WHERE l.\`_parent_id\` = \`proposals\`.\`id\` AND l.\`_locale\` = 'es'), \`add_ons_intro\` = (SELECT \`add_ons_intro\` FROM \`proposals_locales\` l WHERE l.\`_parent_id\` = \`proposals\`.\`id\` AND l.\`_locale\` = 'es'), \`rec_headline\` = (SELECT \`rec_headline\` FROM \`proposals_locales\` l WHERE l.\`_parent_id\` = \`proposals\`.\`id\` AND l.\`_locale\` = 'es'), \`rec_body\` = (SELECT \`rec_body\` FROM \`proposals_locales\` l WHERE l.\`_parent_id\` = \`proposals\`.\`id\` AND l.\`_locale\` = 'es'), \`technical_note\` = (SELECT \`technical_note\` FROM \`proposals_locales\` l WHERE l.\`_parent_id\` = \`proposals\`.\`id\` AND l.\`_locale\` = 'es'), \`terms_title\` = (SELECT \`terms_title\` FROM \`proposals_locales\` l WHERE l.\`_parent_id\` = \`proposals\`.\`id\` AND l.\`_locale\` = 'es'), \`closing\` = (SELECT \`closing\` FROM \`proposals_locales\` l WHERE l.\`_parent_id\` = \`proposals\`.\`id\` AND l.\`_locale\` = 'es');`)
  await db.run(sql`UPDATE \`proposals_findings\` SET \`area\` = (SELECT \`area\` FROM \`proposals_findings_locales\` l WHERE l.\`_parent_id\` = \`proposals_findings\`.\`id\` AND l.\`_locale\` = 'es'), \`title\` = (SELECT \`title\` FROM \`proposals_findings_locales\` l WHERE l.\`_parent_id\` = \`proposals_findings\`.\`id\` AND l.\`_locale\` = 'es'), \`cost\` = (SELECT \`cost\` FROM \`proposals_findings_locales\` l WHERE l.\`_parent_id\` = \`proposals_findings\`.\`id\` AND l.\`_locale\` = 'es');`)
  await db.run(sql`UPDATE \`proposals_figures\` SET \`label\` = (SELECT \`label\` FROM \`proposals_figures_locales\` l WHERE l.\`_parent_id\` = \`proposals_figures\`.\`id\` AND l.\`_locale\` = 'es'), \`source\` = (SELECT \`source\` FROM \`proposals_figures_locales\` l WHERE l.\`_parent_id\` = \`proposals_figures\`.\`id\` AND l.\`_locale\` = 'es');`)
  await db.run(sql`UPDATE \`proposals_deliverables\` SET \`name\` = (SELECT \`name\` FROM \`proposals_deliverables_locales\` l WHERE l.\`_parent_id\` = \`proposals_deliverables\`.\`id\` AND l.\`_locale\` = 'es'), \`description\` = (SELECT \`description\` FROM \`proposals_deliverables_locales\` l WHERE l.\`_parent_id\` = \`proposals_deliverables\`.\`id\` AND l.\`_locale\` = 'es');`)
  await db.run(sql`UPDATE \`proposals_criteria\` SET \`label\` = (SELECT \`label\` FROM \`proposals_criteria_locales\` l WHERE l.\`_parent_id\` = \`proposals_criteria\`.\`id\` AND l.\`_locale\` = 'es');`)
  await db.run(sql`UPDATE \`proposals_packages\` SET \`name\` = (SELECT \`name\` FROM \`proposals_packages_locales\` l WHERE l.\`_parent_id\` = \`proposals_packages\`.\`id\` AND l.\`_locale\` = 'es'), \`body\` = (SELECT \`body\` FROM \`proposals_packages_locales\` l WHERE l.\`_parent_id\` = \`proposals_packages\`.\`id\` AND l.\`_locale\` = 'es');`)
  await db.run(sql`UPDATE \`proposals_packages_values\` SET \`value\` = (SELECT \`value\` FROM \`proposals_packages_values_locales\` l WHERE l.\`_parent_id\` = \`proposals_packages_values\`.\`id\` AND l.\`_locale\` = 'es');`)
  await db.run(sql`UPDATE \`proposals_add_ons\` SET \`name\` = (SELECT \`name\` FROM \`proposals_add_ons_locales\` l WHERE l.\`_parent_id\` = \`proposals_add_ons\`.\`id\` AND l.\`_locale\` = 'es'), \`description\` = (SELECT \`description\` FROM \`proposals_add_ons_locales\` l WHERE l.\`_parent_id\` = \`proposals_add_ons\`.\`id\` AND l.\`_locale\` = 'es');`)
  await db.run(sql`UPDATE \`proposals_terms\` SET \`label\` = (SELECT \`label\` FROM \`proposals_terms_locales\` l WHERE l.\`_parent_id\` = \`proposals_terms\`.\`id\` AND l.\`_locale\` = 'es'), \`value\` = (SELECT \`value\` FROM \`proposals_terms_locales\` l WHERE l.\`_parent_id\` = \`proposals_terms\`.\`id\` AND l.\`_locale\` = 'es');`)
  await db.run(sql`UPDATE \`proposals_scope_items\` SET \`concept\` = (SELECT \`concept\` FROM \`proposals_scope_items_locales\` l WHERE l.\`_parent_id\` = \`proposals_scope_items\`.\`id\` AND l.\`_locale\` = 'es'), \`detail\` = (SELECT \`detail\` FROM \`proposals_scope_items_locales\` l WHERE l.\`_parent_id\` = \`proposals_scope_items\`.\`id\` AND l.\`_locale\` = 'es');`)

  // La recomendada vuelve a guardarse por NOMBRE, que es como la leia el codigo
  // anterior. COALESCE para no vaciarla si la clave ya no casa con ninguna ruta.
  await db.run(sql`UPDATE \`proposals\` SET \`recommended_package\` = COALESCE((SELECT p.\`name\` FROM \`proposals_packages\` p WHERE p.\`_parent_id\` = \`proposals\`.\`id\` AND p.\`key\` = \`proposals\`.\`recommended_package\`), \`recommended_package\`) WHERE \`recommended_package\` IS NOT NULL;`)

  await db.run(sql`DROP TABLE \`proposals_findings_locales\`;`)
  await db.run(sql`DROP TABLE \`proposals_figures_locales\`;`)
  await db.run(sql`DROP TABLE \`proposals_deliverables_locales\`;`)
  await db.run(sql`DROP TABLE \`proposals_criteria_locales\`;`)
  await db.run(sql`DROP TABLE \`proposals_packages_values_locales\`;`)
  await db.run(sql`DROP TABLE \`proposals_packages_locales\`;`)
  await db.run(sql`DROP TABLE \`proposals_add_ons_locales\`;`)
  await db.run(sql`DROP TABLE \`proposals_terms_locales\`;`)
  await db.run(sql`DROP TABLE \`proposals_scope_items_locales\`;`)
  await db.run(sql`DROP TABLE \`proposals_locales\`;`)
  await db.run(sql`ALTER TABLE \`proposals_packages\` DROP COLUMN \`key\`;`)
}
