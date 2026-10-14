import { createServer } from 'node:http';
import { closeDb, migrate } from './db/pool';
import { env } from './env';
import { toNodeHandler } from './http';
import { route } from './server';
import { startSweeper } from './sweeper';

/**
 * @author dop42
 * @method main
 * @description Migrates the database, then serves until told to stop.
 * @remarks On SIGTERM the server stops accepting connections and finishes the ones in
 * flight before the pool is closed, so `docker compose down` never cuts a verification in
 * half.
 * @returns {Promise<void>}
 */
async function main(): Promise<void> {
	const applied = await migrate();
	if (applied.length) console.log(`migrations applied: ${applied.join(', ')}`);

	const stopSweeper = startSweeper();
	const server = createServer(toNodeHandler(route));
	server.listen(env.port, () => console.log(`listening on :${env.port}`));

	const stop = () => {
		stopSweeper();
		server.close(() => void closeDb().then(() => process.exit(0)));
	};
	process.once('SIGTERM', stop);
	process.once('SIGINT', stop);
}

main().catch((error) => {
	console.error(error);
	process.exit(1);
});
