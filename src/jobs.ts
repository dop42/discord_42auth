/** A task the instance runs on its own, every so often. */
export interface Job {
	name: string;
	everyMs: number;
	/** Returns a one-line summary for the logs, or nothing when there was nothing to do. */
	run: () => Promise<string | void>;
}

/**
 * Runs each job a little after boot, then on its own interval, never two runs of the same
 * job at once.
 * @remarks The first runs are spread over the first minutes so a restart does not fire every
 * job at the 42 API in the same second. A job that throws is logged and simply runs again at
 * its next turn.
 * @returns stops every timer
 */
export function startJobs(jobs: Job[]): () => void {
	const timers: Array<ReturnType<typeof setTimeout>> = [];
	jobs.forEach((job, index) => {
		let running = false;
		const run = async () => {
			if (running) return;
			running = true;
			try {
				const summary = await job.run();
				if (summary) console.log(`${job.name}: ${summary}`);
			} catch (failure) {
				console.error(`${job.name} failed:`, failure);
			} finally {
				running = false;
			}
		};
		timers.push(setTimeout(run, (90 + index * 45) * 1000));
		timers.push(setInterval(run, job.everyMs));
	});
	return () => timers.forEach((timer) => clearTimeout(timer));
}

/**
 * Runs one server's share of a job, logging a failure instead of throwing it.
 * @remarks A server that took a permission back from the bot must not stop the job for every
 * server after it. The log names no server: only the error goes there.
 * @returns whether it went through
 */
export async function forEachGuild(job: string, work: () => Promise<void>): Promise<boolean> {
	try {
		await work();
		return true;
	} catch (failure) {
		console.error(`${job}: one server skipped: ${(failure as Error).message}`);
		return false;
	}
}
