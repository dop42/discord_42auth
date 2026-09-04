# Setup

A Discord application, a 42 application, a Vercel project. No database.
Around ten minutes.

---

## 0. Vercel project

Import your fork on <https://vercel.com/new>, or `npm i -g vercel && vercel link`.
Note the project name: it is the domain used in steps 2 and 5.

---

## 1. Discord application

<https://discord.com/developers/applications> → **New Application**.

- *General Information* → copy the **Application ID** and the **Public Key**.
- *Bot* → **Reset Token** → copy it. Keep it secret.

---

## 2. 42 application

<https://profile.intra.42.fr/oauth/applications/new>.

- **Redirect URI**: `https://<your-project>.vercel.app/api/callback`
- **Scope**: `public` — nothing else is needed
- Copy the **UID** and the **Secret**.

---

## 3. Invite the bot

*OAuth2 → URL Generator*, scopes `bot` + `applications.commands`, permissions
**Manage Roles** and **Manage Nicknames**. Open the URL, add the bot.

> In *Server Settings → Roles*, drag the bot role **above** the role it grants.
> Discord refuses to manage a role ranked higher than its own — this is the
> number one cause of "Could not grant the role".

If you set `LOG_CHANNEL_ID`, the bot also needs **View Channel** and **Send
Messages** in that channel. It fails quietly otherwise: the role is granted, the
log line is not written, and only the deployment logs say so.

---

## 4. Deploy

Turn on *User Settings → Advanced → Developer Mode*, then right-click the server
icon, the role and the log channel → **Copy ID**.

Set these on Vercel (dashboard or `vercel env add`), from steps 1 to 3:

```bash
DISCORD_APP_ID       DISCORD_PUBLIC_KEY    DISCORD_BOT_TOKEN
FT_CLIENT_ID         FT_CLIENT_SECRET
STATE_SECRET         # openssl rand -hex 32
PUBLIC_URL           # https://<your-project>.vercel.app — optional on Vercel
GUILD_ID             ROLE_ID
FT_CAMPUS            STUDENTS_ONLY    NICKNAME_MODE    LOG_CHANNEL_ID   # optional
```

```bash
vercel deploy --prod
```

---

## 5. Point Discord at it

*General Information* → **Interactions Endpoint URL**:

```text
https://<your-project>.vercel.app/api/interactions
```

Discord sends a signed ping on save. If it saves, the signature check works.

---

## 6. Register the commands

```bash
npm install
vercel env pull --environment=production .env
npm run register
```

`vercel env pull` defaults to the *development* environment; without the flag it
writes an empty file and `npm run register` stops on a missing variable.

Guild commands appear instantly. Run `/config` to check what took effect, then
`/auth` to try it.

---

## Commands

| Command | Who | What |
| --- | --- | --- |
| `/auth` | everyone | Returns a private, 5-minute link to verify a 42 account |
| `/config` | Manage Server | Shows what this deployment is set to |

---

## Settings

No database and no runtime configuration: the bot is configured with
environment variables, next to its secrets. Changing one means editing it on
Vercel and **redeploying** — nothing applies to the running deployment.

| Variable | Required | What it does |
| --- | --- | --- |
| `GUILD_ID` | yes | The one server this deployment serves |
| `ROLE_ID` | yes | Role granted to verified members |
| `FT_CAMPUS` | no | Restrict to one campus, spelled as on the intra. Empty accepts any |
| `STUDENTS_ONLY` | no | Refuse alumni and closed accounts. Anything but `false` keeps it on |
| `NICKNAME_MODE` | no | `off`, `login` (default), or `full` — `John Doe (jdoe)` |
| `LOG_CHANNEL_ID` | no | Channel logging who authenticated as whom |

Credentials (`DISCORD_*`, `FT_*`, `STATE_SECRET`, `PUBLIC_URL`) are listed in
[../.env.example](../.env.example).

---

## Troubleshooting

| Symptom | Cause |
| --- | --- |
| Discord refuses the endpoint URL | `DISCORD_PUBLIC_KEY` wrong, or deploy not live |
| Commands do not appear | `npm run register` not run, or `GUILD_ID` is another server |
| "This bot is configured for another server" | `GUILD_ID` does not match where you typed the command |
| `/auth` says not configured | `ROLE_ID` missing, or set after the last deploy |
| Settings changed, nothing happened | Environment variables only apply on a **new deployment** |
| "Authentication failed", logs say "Could not grant the role" | Bot role too low, or **Manage Roles** missing |
| Every command says "Something went wrong" | A malformed setting — `NICKNAME_MODE` outside `off`/`login`/`full`, an id that is not bare digits, or a `STATE_SECRET` under 32 characters. The deployment logs name it |
| Role granted, nothing in the log channel | The bot cannot see or write in `LOG_CHANNEL_ID` |
| Role granted but no rename | The member outranks the bot, or owns the server — harmless |
| "Invalid link" | Older than five minutes, or `STATE_SECRET` changed since it was issued |
| Everyone refused on campus | `FT_CAMPUS` misspelled — the refusal message shows both names |
| 42 rejects the redirect URI | It must equal `PUBLIC_URL` + `/api/callback`, exactly |
