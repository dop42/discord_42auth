import { createServer } from 'node:http';
import { closeDb, migrate } from './db/pool';
import { env } from './env';
import { toNodeHandler } from './http';
import { route } from './server';
import { startSweeper } from './sweeper';

/**
 * Migrates the database, then serves until told to stop.
 * @remarks On SIGTERM the server stops accepting connections and finishes the ones in
 * flight before the pool is closed, so a restart never cuts a verification in half.
 */
async function main(): Promise<void> {
	const applied = await migrate();
	if (applied.length) console.log(`migrations applied: ${applied.join(', ')}`);

	const stopSweeper = startSweeper();
	const server = createServer(toNodeHandler(route));
	server.listen(env.port, env.host, () => console.log(`listening on ${env.host}:${env.port}`));

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
