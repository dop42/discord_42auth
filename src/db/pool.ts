import { readdir, readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { Pool } from 'pg';
import { env } from '../env';

/** Directory of the numbered `.sql` files, applied in name order. Resolved from the working
 * directory rather than this file, which sits at a different depth once compiled. */
const MIGRATIONS = join(process.cwd(), 'migrations');

let pool: Pool | undefined;

/** Returns the shared connection pool, opening it on first use. */
export function db(): Pool {
	pool ??= new Pool({ connectionString: env.databaseUrl, max: 10 });
	return pool;
}

/**
 * Applies every migration not applied yet, each in its own transaction.
 * @remarks Run at boot, before the server listens. An advisory lock keeps two instances
 * starting together from applying the same file twice. A failing file rolls back alone and
 * stops the boot, so the bot never serves against a half-migrated schema.
 * @returns the files applied by this call
 */
export async function migrate(directory = MIGRATIONS): Promise<string[]> {
	const client = await db().connect();
	try {
		await client.query('SELECT pg_advisory_lock(4242)');
		await client.query(
			'CREATE TABLE IF NOT EXISTS schema_migrations (name text PRIMARY KEY, applied_at timestamptz NOT NULL DEFAULT now())',
		);
		const { rows } = await client.query<{ name: string }>('SELECT name FROM schema_migrations');
		const done = new Set(rows.map((row) => row.name));

		const files = (await readdir(directory)).filter((file) => file.endsWith('.sql')).sort();
		const applied: string[] = [];
		for (const file of files) {
			if (done.has(file)) continue;
			const sql = await readFile(join(directory, file), 'utf8');
			await client.query('BEGIN');
			try {
				await client.query(sql);
				await client.query('INSERT INTO schema_migrations (name) VALUES ($1)', [file]);
				await client.query('COMMIT');
			} catch (error) {
				await client.query('ROLLBACK');
				throw new Error(`Migration ${file} failed: ${(error as Error).message}`);
			}
			applied.push(file);
		}
		return applied;
	} finally {
		await client.query('SELECT pg_advisory_unlock(4242)').catch(() => undefined);
		client.release();
	}
}

/** Closes the pool, letting the process exit. */
export async function closeDb(): Promise<void> {
	await pool?.end();
	pool = undefined;
}
