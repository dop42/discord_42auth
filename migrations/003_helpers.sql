-- `/helpers` lists the members on campus who validated a project, with their seat. Off until
-- an admin turns it on: it shows where people sit, which a server must choose to share.
ALTER TABLE guilds ADD COLUMN helpers boolean NOT NULL DEFAULT false;

-- A member who chose, with `/visibility`, never to be listed by `/helpers` on this server.
-- Kept when they verify again, dropped with the link.
ALTER TABLE links ADD COLUMN hidden boolean NOT NULL DEFAULT false;
