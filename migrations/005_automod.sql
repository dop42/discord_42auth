-- Discord AutoMod: the filters a server turned on from the dashboard.
ALTER TABLE guilds
	ADD COLUMN automod_spam boolean NOT NULL DEFAULT false,
	-- Most mentions allowed per message; null keeps the mention filter off.
	ADD COLUMN automod_mentions smallint CHECK (automod_mentions BETWEEN 1 AND 50),
	ADD COLUMN automod_language boolean NOT NULL DEFAULT false,
	-- Words of the custom filter; empty keeps it off.
	ADD COLUMN automod_keywords text[] NOT NULL DEFAULT '{}',
	ADD COLUMN automod_alert_channel_id text CHECK (automod_alert_channel_id ~ '^\d{17,20}$');

-- Which Discord AutoMod rule carries which filter, so a save updates it instead of adding
-- another. `created` tells a rule the bot made, deleted when the filter goes off, from one an
-- admin had made and the bot took over, only disabled. Goes with the server.
CREATE TABLE guild_automod (
	guild_id text NOT NULL REFERENCES guilds ON DELETE CASCADE,
	kind     text NOT NULL CHECK (kind IN ('spam', 'mentions', 'language', 'custom')),
	rule_id  text NOT NULL CHECK (rule_id ~ '^\d{17,20}$'),
	created  boolean NOT NULL,
	PRIMARY KEY (guild_id, kind)
);
