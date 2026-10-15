-- Hall of fame, campus events, live counter: what one server turned on.
ALTER TABLE guilds
	-- Channel the validated projects of its members are announced in; null keeps it off.
	ADD COLUMN fame_channel_id text CHECK (fame_channel_id ~ '^\d{17,20}$'),
	-- Up to when the validations were already announced, so none is posted twice.
	ADD COLUMN fame_checked_at timestamptz,
	-- Copy the campus events, and the exams, into the server's Discord events.
	ADD COLUMN sync_events boolean NOT NULL DEFAULT false,
	ADD COLUMN sync_exams boolean NOT NULL DEFAULT false,
	-- Voice channel renamed with the number of people on campus; null keeps it off.
	ADD COLUMN counter_channel_id text CHECK (counter_channel_id ~ '^\d{17,20}$');

-- Which Discord event mirrors which intra event, so it is updated, never duplicated, and
-- removed when the intra cancels it. Goes with the server.
CREATE TABLE guild_events (
	guild_id         text NOT NULL REFERENCES guilds ON DELETE CASCADE,
	source           text NOT NULL CHECK (source IN ('event', 'exam')),
	ft_id            integer NOT NULL,
	discord_event_id text NOT NULL CHECK (discord_event_id ~ '^\d{17,20}$'),
	-- The intra's own `updated_at`: a change there is copied over.
	ft_updated_at    timestamptz NOT NULL,
	begin_at         timestamptz NOT NULL,
	PRIMARY KEY (guild_id, source, ft_id)
);

-- Members who asked, with `/reminder`, for a private message before their deadline. Per
-- Discord account, not per server: it is one message to one person. Their 42 account is read
-- from their links, and the row goes once they have none left.
CREATE TABLE reminders (
	user_id    text PRIMARY KEY CHECK (user_id ~ '^\d{17,20}$'),
	days       smallint NOT NULL CHECK (days BETWEEN 1 AND 60),
	-- The member's language when they asked, for the message itself.
	locale     text NOT NULL CHECK (char_length(locale) BETWEEN 2 AND 10),
	-- The deadline last reminded about: a new deadline earns a new reminder, not the same one.
	sent_for   timestamptz,
	checked_at timestamptz NOT NULL DEFAULT '-infinity'
);

-- Discord Linked Roles: the member's refresh token, encrypted with the instance secret, so
-- the level shown on their Discord profile is kept up to date. Revoking the app on Discord,
-- or losing every link, deletes it.
CREATE TABLE role_connections (
	user_id       text PRIMARY KEY CHECK (user_id ~ '^\d{17,20}$'),
	refresh_token bytea NOT NULL,
	updated_at    timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX role_connections_updated_at ON role_connections (updated_at);
