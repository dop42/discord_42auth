# Pull request template

> [!IMPORTANT]
> Please complete all fields. PRs will not be merged if any fields are incomplete. Be respectful, and keep in mind that it may take some time for your PR to be reviewed.
>
> Bear in mind refactors are up to the maintainers and not to contributors — we are the ones supporting this afterwards. If your change is big, consider releasing it under your own fork instead.
>
> This bot is an access gate. A bug here does not crash a server, it lets the wrong people in. Changes to `src/state.ts`, `src/rules.ts`, `src/settings.ts`, `src/discord/verify.ts` or `api/` get reviewed on that basis.

> [!CAUTION]
> Never paste a bot token, a client secret, a `STATE_SECRET`, or a full verification link in this PR — not in the description, not in a screenshot, not in a log excerpt. Crop your URLs before `&state=`.

## Type of change

- [ ] Bug fix (non-breaking change which fixes an issue)
- [ ] New feature (non-breaking change which adds functionality)
- [ ] Breaking change (fix or feature that would cause existing functionality to not work as expected)
- [ ] Security fix (changes who can obtain the role, or how identity is proven)
- [ ] New or updated translation

### Motive for This Pull Request
explanation field

### Provide a brief explanation of why these changes are being proposed and what they aim to achieve.
explanation field

### Explain the necessity of these changes and how they will impact the bot, the people who fork it, or the members it verifies.
explanation field

### Does this change what a member has to do, or what an admin has to configure?
> If yes, say exactly what breaks for a server already running this bot, and what its admins must do after updating.

explanation field

### Please describe the tests you have conducted to verify your changes. Provide instructions so we can reproduce these tests. Also, list any relevant details for your test configuration.

- [ ] `npm run typecheck` passes
- [ ] `npm test` passes
- [ ] Deployed to my own Vercel project and Discord application
- [ ] Ran `npm run register` (required if `src/commands/definitions.ts` changed)
- [ ] Ran the panel button and `/auth` end to end with a real 42 account and got the role
- [ ] Tested at least one refusal path (wrong campus, alumni, expired link)

explanation field

### If you touched the messages

- [ ] The new key is present in all 7 locale bundles (`npm run typecheck` fails otherwise)
- [ ] `{placeholders}` left untouched in every bundle
- [ ] `cmd.*` descriptions stay under 100 characters (`npm test` checks this)

### If you touched the verification flow

- [ ] I described what an attacker gains or loses from this change
- [ ] The link still expires, and still cannot be retargeted at another member
- [ ] Nothing the member controls is trusted without being signed or re-fetched from the 42 API

## Notes if any
explanation field
