-- The campus events are no longer copied into Discord: they showed too much of the intra to
-- the whole server. Exams are announced in a channel instead. The events already copied are
-- deleted by the bot from `guild_events`, which stays until it is empty.
ALTER TABLE guilds
	DROP COLUMN sync_events,
	DROP COLUMN sync_exams,
	-- Channel the coming exams are announced in; null keeps it off.
	ADD COLUMN exam_channel_id text CHECK (exam_channel_id ~ '^\d{17,20}$');

-- Which exams a server was already told about, so each is announced once. Goes with the
-- server, and a day after the exam began.
CREATE TABLE exam_announcements (
	guild_id text NOT NULL REFERENCES guilds ON DELETE CASCADE,
	ft_id    integer NOT NULL,
	begin_at timestamptz NOT NULL,
	PRIMARY KEY (guild_id, ft_id)
);
