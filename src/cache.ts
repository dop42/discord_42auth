/**
 * Remembers values for a while, in memory.
 * @remarks For what the 42 API answers the same to everyone for a few minutes: the people on
 * a campus, a project's name. Losing it on a restart only costs a few calls. A load that
 * fails is not remembered. Expired entries are swept once the map grows past `max`.
 */
export class TtlCache<K, V> {
	private readonly entries = new Map<K, { value: Promise<V>; expiresAt: number }>();

	constructor(
		private readonly ttlMs: number,
		private readonly max = 1000,
	) {}

	/**
	 * Returns the remembered value, or loads and remembers it.
	 * @remarks Two callers asking for the same key at once share one load.
	 */
	get(key: K, load: () => Promise<V>, now = Date.now()): Promise<V> {
		const entry = this.entries.get(key);
		if (entry && entry.expiresAt > now) return entry.value;

		if (this.entries.size >= this.max) {
			for (const [stale, { expiresAt }] of this.entries) {
				if (expiresAt <= now) this.entries.delete(stale);
			}
		}
		const value = load();
		this.entries.set(key, { value, expiresAt: now + this.ttlMs });
		value.catch(() => {
			if (this.entries.get(key)?.value === value) this.entries.delete(key);
		});
		return value;
	}
}
