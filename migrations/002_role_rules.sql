-- Extra roles granted on top of the verified role, to members matching a condition:
-- [{ "kind": "campus" | "cursus" | "coalition", "value": text, "roleId": snowflake }].
-- Validated by the server before it is written; at most 25 per server.
ALTER TABLE guilds ADD COLUMN role_rules jsonb NOT NULL DEFAULT '[]'
	CHECK (jsonb_typeof(role_rules) = 'array' AND jsonb_array_length(role_rules) <= 25);

-- Last time the 42 account behind a link was looked up again. The sweeper takes the role
-- back from an account that was closed, went alumni, or no longer meets the server's rules.
ALTER TABLE links ADD COLUMN ft_checked_at timestamptz NOT NULL DEFAULT now();
CREATE INDEX links_ft_checked_at ON links (ft_checked_at);
