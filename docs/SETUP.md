# Setup

One instance serves every Discord server that adds the bot. It runs on your own
machine with Docker: the bot, a PostgreSQL database, and optionally Caddy for
HTTPS. Server admins then configure their server from the dashboard, without
touching any of this.

---

## 0. Machine

- Docker with the compose plugin.
- A domain name pointing at the machine, ports 80 and 443 open — or an existing
  reverse proxy you will point at `127.0.0.1:3000`. That proxy must append the
  client address to `X-Forwarded-For` (nginx: `proxy_set_header X-Forwarded-For
  $proxy_add_x_forwarded_for;`), or every visitor shares one rate-limit budget.
- `gpg` for the encrypted backups.

---

## 1. Discord application

<https://discord.com/developers/applications> → **New Application**.

- *General Information* → copy the **Application ID** and the **Public Key**.
- *Bot* → **Reset Token** → copy it. Leave **Public Bot** on so admins can add it.
- *OAuth2* → copy the **Client Secret**, and add the redirect
  `https://<your-domain>/auth/callback` — this is the dashboard login.
- *General Information* → fill in **Privacy Policy URL** `https://<your-domain>/privacy`
  and **Terms of Service URL** `https://<your-domain>/terms`. Discord requires both
  before a bot can be verified, and they are the pages admins and members are sent to.

---

## 2. 42 application

<https://profile.intra.42.fr/oauth/applications/new>.

- **Redirect URI**: `https://<your-domain>/api/callback`
- **Scope**: `public` — nothing else is needed
- Copy the **UID** and the **Secret**.

---

## 3. Configure and start

```bash
cp .env.example .env
chmod 600 .env
openssl rand -hex 32   # three times: STATE_SECRET, POSTGRES_PASSWORD, BACKUP_PASSPHRASE
$EDITOR .env
```

`OPERATOR_NAME`, `OPERATOR_CONTACT` and `HOSTING_LOCATION` are shown on the
privacy page: they are who answers data-protection requests.

```bash
docker compose --profile caddy up -d --build   # with Caddy getting the certificate
docker compose up -d --build                   # behind your own proxy, on 127.0.0.1:3000
```

The database schema is created on the first start. `docker compose logs -f bot`
should end with `listening on :3000`.

---

## 4. Point Discord at it

*General Information* → **Interactions Endpoint URL**:

```text
https://<your-domain>/api/interactions
```

Discord sends a signed ping on save. If it saves, the signature check works.

---

## 5. Register the commands

```bash
npm install
npm run register
```

Commands are global: they reach every server the bot joins, within a few
minutes. Run it again whenever `src/commands/definitions.ts` or a `cmd.*`
translation changes.

> **Coming from the Vercel version?** Keep `GUILD_ID` in `.env` for this one run:
> the script also clears that server's old guild commands, which would otherwise
> show up twice. Then set the old server up from the dashboard like any other.

---

## 6. Backups

```cron
0 4 * * * cd /path/to/discord_42auth && ./scripts/backup.sh
```

Without Docker, as root, against the local PostgreSQL, with the passphrase kept
out of the bot's `.env`:

```cron
0 4 * * * BACKUP_DB=discord_42auth BACKUP_DIR=/var/backups/discord_42auth BACKUP_PASSPHRASE_FILE=/root/.auth42-backup-passphrase /srv/discord_42auth/app/scripts/backup.sh
```

A dump that fails or comes out truncated is deleted and the older backups are
kept. Dumps are encrypted with `BACKUP_PASSPHRASE` and deleted after 7 days — the
retention promised on the privacy page. Copy them off the machine if you want
them to survive a disk failure; keep the passphrase somewhere else.

---

## Without Docker (systemd)

The same instance runs fine as a plain systemd service, which is how the reference
instance is hosted. One-time setup on a Debian server, as root:

```bash
apt install postgresql caddy git gnupg
useradd --system --home-dir /srv/discord_42auth --shell /usr/sbin/nologin auth42
mkdir -p /srv/discord_42auth
su postgres -c "createuser auth42 && createdb -O auth42 discord_42auth"
# Node 22 for root through nvm: the deploy script builds with it.
```

`/srv/discord_42auth/.env`, owned `root:auth42`, mode `640`: the variables of
`.env.example`, with the database reached over the local socket, so no password
exists at all:

```dotenv
DATABASE_URL=postgresql://auth42@/discord_42auth?host=/var/run/postgresql
```

In front of it, either Caddy — the `Caddyfile` of this repository with the domain
written in, proxying to `127.0.0.1:3000` — or a Cloudflare Tunnel, which keeps the
machine's address out of DNS and needs no open port (see below). Then, from your
machine:

```bash
./scripts/deploy.sh <ssh-host>
```

It sends the committed `HEAD`, builds it on the server, installs
`deploy/discord_42auth.service`, swaps the new version in and restarts it. If
`/health` does not answer within 30 seconds, the previous version is put back.
Logs: `journalctl -u discord_42auth`. The service runs as `auth42`, cannot write
anywhere, and holds no capability.

### Behind a Cloudflare Tunnel

The reference instance is reached only through a tunnel: `cloudflared` dials out
to Cloudflare, so ports 80 and 443 stay closed and DNS only shows Cloudflare.

1. Add the domain to Cloudflare and switch its nameservers. Delete any `A`/`AAAA`
   record of the bot's hostname: it would publish the address.
2. *Zero Trust → Networks → Tunnels → Create a tunnel* (cloudflared), then run the
   `cloudflared service install <token>` it shows on the server.
3. *Public hostname*: the bot's hostname → `HTTP` → `127.0.0.1:3000`, straight to
   the bot. A local proxy in between would replace the client address with its
   own, and every visitor would share one rate-limit budget.
4. *SSL/TLS → Edge Certificates*: **Always Use HTTPS** and **HSTS** on, what Caddy
   did. Leave **Bot Fight Mode** off: it challenges the requests Discord sends to
   `/api/interactions`, and the bot stops answering.

Cloudflare appends the visitor's address to `X-Forwarded-For`, and the bot trusts
that header from loopback only. Once the hostname answers through the tunnel,
stop Caddy and close 80 and 443.

---

## For server admins

1. Open the dashboard, log in with Discord. Only servers where you have
   **Manage Server** are listed.
2. **Add the bot** to your server from its card.
3. In *Server Settings → Roles*, drag the bot role **above** the role it grants.
   The dashboard greys out roles it cannot grant.
4. Choose the role and the rules, save.
5. Under **Verification panel**, pick the channel where members should verify and
   post it — or run `/panel` in that channel.
6. The **Members** tab lists who verified, with their 42 login; **Unlink** takes
   the link, the roles and the nickname back.

| Command | Who | What |
| --- | --- | --- |
| `/panel` | Manage Server | Posts the verification panel, with the button members press |
| `/config` | Manage Server | Shows the settings and links to the dashboard |
| `/forget` | Everyone | Erases the caller's 42 link on this server and takes the role back |

### Settings

| Setting | What it does |
| --- | --- |
| Role | Granted to verified members. Without it verification is disabled |
| Campus | Restrict to one campus, spelled as on the intra. Empty accepts any |
| Active students only | Refuse alumni. Closed accounts are always refused |
| Nickname | Unchanged, the intra login, or `John Doe (jdoe)` |
| Log channel | Posts who authenticated as whom, and whose verification the weekly check revoked. Those messages stay in Discord, under your responsibility |
| Extra roles | Up to 25 rules granting a role on top of the verified one: by primary campus, by cursus currently running (`42cursus`, `c-piscine`), or by coalition. Name or slug, case-insensitive |

Every account is looked up on the intra again once a week, with the 42
application's own token. One that was closed, went alumni (with *Active
students only*) or left the campus loses its link and roles, and the log
channel says why; the others get their extra roles brought up to date. The
check spends at most 100 accounts an hour, through the same rate limiter as
the verifications, which always go first.

A 42 account vouches for one member per server. A second Discord account
verifying with it is refused while the first is still in the server; once the
first has left, the link moves to the new one.

---

## Development

```bash
docker run --rm -d -p 127.0.0.1:5432:5432 -e POSTGRES_PASSWORD=dev --name pg-dev postgres:17-alpine
# .env: DATABASE_URL=postgres://postgres:dev@localhost:5432/postgres, PUBLIC_URL=http://localhost:5173
npm run dev                  # server on :3000
npm --prefix web run dev     # dashboard on :5173, proxying /api and /auth to :3000
```

With `PUBLIC_URL=http://localhost:5173`, add `http://localhost:5173/auth/callback`
as a redirect in the Discord portal to log in locally.

```bash
npm test                                   # locales + unit tests
TEST_DATABASE_URL=postgres://… npm test    # + database tests; empties that database
npm --prefix web run lint && npm --prefix web test && npm --prefix web run e2e
```

---

## Troubleshooting

| Symptom | Cause |
| --- | --- |
| Discord refuses the endpoint URL | `DISCORD_PUBLIC_KEY` wrong, or the instance is not reachable over HTTPS |
| Commands do not appear | `npm run register` not run, or Discord still propagating — wait a few minutes |
| Commands show twice | Old guild commands from the Vercel version: run `npm run register` with `GUILD_ID` set |
| Dashboard login loops back to the home page | Redirect `…/auth/callback` missing in the Discord portal, or `DISCORD_CLIENT_SECRET` wrong. The bot logs say which |
| Saving says the request was refused (403) | `PUBLIC_URL` is not exactly the address in the browser bar |
| The button says not configured | No role chosen on the dashboard |
| "Authentication failed", logs say "Could not grant the role" | Bot role too low, or **Manage Roles** missing |
| Role granted but no rename | The member outranks the bot, or owns the server — harmless |
| Role granted, nothing in the log channel | The bot cannot see or write in that channel |
| "This 42 account is already linked to another member" | That account verified another Discord account still in the server |
| "Invalid link" | Older than five minutes, or `STATE_SECRET` changed since — press the button again |
| Dashboard says "Too many requests" | 20 logins or 120 API calls a minute per address. Behind your own proxy, check it sets `X-Forwarded-For` |
| "The bot could not write in this channel" when posting the panel | The bot lacks **View Channel** or **Send Messages** there |
| An extra role is never granted | The value does not match the intra spelling, or the role sits above the bot's. Coalition names are per campus |
| 42 rejects the redirect URI | It must equal `PUBLIC_URL` + `/api/callback`, exactly |
