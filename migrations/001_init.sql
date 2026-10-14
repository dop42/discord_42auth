-- What each Discord server does. A row exists only once an admin saved the settings;
-- a server with no row is simply not configured yet.
CREATE TABLE guilds (
	guild_id       text PRIMARY KEY CHECK (guild_id ~ '^\d{17,20}$'),
	role_id        text CHECK (role_id ~ '^\d{17,20}$'),
	campus         text CHECK (char_length(campus) BETWEEN 1 AND 64),
	students_only  boolean NOT NULL DEFAULT true,
	nickname_mode  text NOT NULL DEFAULT 'login' CHECK (nickname_mode IN ('off', 'login', 'full')),
	log_channel_id text CHECK (log_channel_id ~ '^\d{17,20}$'),
	updated_at     timestamptz NOT NULL DEFAULT now()
);

-- Which Discord member proved which 42 account, per server. Scoped to the server on
-- purpose: each server's admins are a separate controller, so a link made on one server
-- is never visible from, nor reused by, another. Only the identifiers are kept.
CREATE TABLE links (
	guild_id    text NOT NULL REFERENCES guilds ON DELETE CASCADE,
	user_id     text NOT NULL CHECK (user_id ~ '^\d{17,20}$'),
	ft_id       integer NOT NULL,
	ft_login    text NOT NULL,
	verified_at timestamptz NOT NULL DEFAULT now(),
	-- Last time the member was seen in the server; the sweeper deletes links of members who left.
	checked_at  timestamptz NOT NULL DEFAULT now(),
	PRIMARY KEY (guild_id, user_id),
	UNIQUE (guild_id, ft_id)
);
CREATE INDEX links_checked_at ON links (checked_at);

-- Dashboard logins. Only a hash of the cookie is stored, so a database leak hands out no
-- usable session.
CREATE TABLE sessions (
	token_hash  bytea PRIMARY KEY,
	user_id     text NOT NULL,
	username    text NOT NULL,
	avatar      text,
	-- Servers the admin could manage at login: [{ id, name, icon }].
	guilds      jsonb NOT NULL,
	expires_at  timestamptz NOT NULL
);
CREATE INDEX sessions_expires_at ON sessions (expires_at);
