-- The Discord events no longer show the addresses of the intra description and link to the
-- intra page behind a label: every event already mirrored is rewritten at the next sync.
UPDATE guild_events SET ft_updated_at = 'epoch';
