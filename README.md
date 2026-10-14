# discord_42auth

<p>
  <img src="https://img.shields.io/badge/language-TypeScript-3178C6?style=flat-square&logo=typescript&logoColor=white" alt="TypeScript">
  <img src="https://img.shields.io/badge/hosting-Docker-2496ED?style=flat-square&logo=docker&logoColor=white" alt="Docker">
  <img src="https://img.shields.io/badge/database-PostgreSQL-4169E1?style=flat-square&logo=postgresql&logoColor=white" alt="PostgreSQL">
  <img src="https://img.shields.io/badge/discord-HTTP%20interactions-5865F2?style=flat-square&logo=discord&logoColor=white" alt="Discord HTTP interactions">
  <img src="https://img.shields.io/badge/i18n-7%20languages-4c1?style=flat-square" alt="7 languages">
  <img src="https://img.shields.io/badge/license-MIT-4c1?style=flat-square" alt="MIT">
</p>

*This project is not part of the 42 curriculum. It was written by lmouta-g (dop42), for 42 Discord communities that have no doorman.*

---

## Description

**discord_42auth** gates a Discord server behind a **42 intra account**.

A member presses the button on the verification panel, logs in on the intranet,
and gets a role. No role is granted without a 42 login being completed. Small 42
communities usually have no filter at all: anyone with an invite link walks
straight in.

One instance serves every server that adds the bot. Admins log in on the
**web dashboard** with Discord, pick the role and the rules, and post the panel
with `/panel`. Members can erase their own link with `/forget`.

It runs as **HTTP interactions** — no gateway connection — on your own machine
with Docker: the bot, PostgreSQL, and optionally Caddy for HTTPS. A 42 account
vouches for one member per server, and what the bot keeps is deleted once the
member leaves or the bot is removed.

```text
panel button ──▶ 42 OAuth ──▶ /api/callback ──▶ link + role + nickname + log
dashboard ──▶ Discord OAuth ──▶ /api/guilds/:id ──▶ settings in PostgreSQL
```

Answers follow the reader's language: English, French, Spanish, German,
Italian, Dutch and Portuguese (Brazil).

---

## Documentation

- [docs/SETUP.md](docs/SETUP.md) — host it, configure it, use it
- [docs/RGPD.md](docs/RGPD.md) — data protection: roles, retention, what is left to do

---

## License

MIT — fork it, change it, run it for your campus.
