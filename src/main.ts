import { createServer } from 'node:http';
import { closeDb, migrate } from './db/pool';
import { env } from './env';
import { toNodeHandler } from './http';
import { route } from './server';
import { updateCounters } from './counter';
import { syncEvents } from './events';
import { announceFame } from './fame';
import { startJobs } from './jobs';
import { refreshLinkedRoles } from './linkedRoles';
import { sendReminders } from './reminders';
import { startSweeper } from './sweeper';

const MINUTE = 60 * 1000;

/**
 * Migrates the database, then serves until told to stop.
 * @remarks On SIGTERM the server stops accepting connections and finishes the ones in
 * flight before the pool is closed, so a restart never cuts a verification in half.
 */
async function main(): Promise<void> {
	const applied = await migrate();
	if (applied.length) console.log(`migrations applied: ${applied.join(', ')}`);

	const stopSweeper = startSweeper();
	const stopJobs = startJobs([
		{ name: 'fame', everyMs: 15 * MINUTE, run: () => announceFame() },
		{ name: 'counter', everyMs: 10 * MINUTE, run: updateCounters },
		{ name: 'events', everyMs: 60 * MINUTE, run: () => syncEvents() },
		{ name: 'reminders', everyMs: 60 * MINUTE, run: () => sendReminders() },
		{ name: 'linked-roles', everyMs: 60 * MINUTE, run: refreshLinkedRoles },
	]);
	const server = createServer(toNodeHandler(route));
	server.listen(env.port, env.host, () => console.log(`listening on ${env.host}:${env.port}`));

	const stop = () => {
		stopSweeper();
		stopJobs();
		server.close(() => void closeDb().then(() => process.exit(0)));
	};
	process.once('SIGTERM', stop);
	process.once('SIGINT', stop);
}

main().catch((error) => {
	console.error(error);
	process.exit(1);
});
