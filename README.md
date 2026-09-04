# discord_42auth

<p>
  <img src="https://img.shields.io/badge/language-TypeScript-3178C6?style=flat-square&logo=typescript&logoColor=white" alt="TypeScript">
  <img src="https://img.shields.io/badge/hosting-Vercel-000000?style=flat-square&logo=vercel&logoColor=white" alt="Vercel">
  <img src="https://img.shields.io/badge/discord-HTTP%20interactions-5865F2?style=flat-square&logo=discord&logoColor=white" alt="Discord HTTP interactions">
  <img src="https://img.shields.io/badge/runtime%20deps-0-4c1?style=flat-square" alt="Zero runtime dependencies">
  <img src="https://img.shields.io/badge/i18n-7%20languages-4c1?style=flat-square" alt="7 languages">
  <img src="https://img.shields.io/badge/license-MIT-4c1?style=flat-square" alt="MIT">
</p>

*This project is not part of the 42 curriculum. It was written by lmouta-g (dop42), for 42 Discord communities that have no doorman.*

---

## Description

**discord_42auth** gates a Discord server behind a **42 intra account**.

A member presses the button on the verification panel — or runs `/auth` — logs
in on the intranet, and gets a role. No role is granted without a 42 login being
completed. Small 42 communities usually have no filter at all: anyone with an
invite link walks straight in.

Admins post the panel with `/panel`, and check the deployment with `/config`.

It runs as **HTTP interactions on Vercel**: no gateway connection, no server to
keep alive, no database, free tier friendly. One deployment serves one Discord
server, so fork it, set a handful of environment variables, and it is yours.

```text
panel button or /auth ──▶ 42 OAuth ──▶ /api/callback ──▶ role + nickname + log
```

Answers follow the reader's language: English, French, Spanish, German,
Italian, Dutch and Portuguese (Brazil).

---

## Documentation

- [docs/SETUP.md](docs/SETUP.md) — deploy it and configure it

---

## License

MIT — fork it, change it, run it for your campus.
