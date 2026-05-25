# Hermes VPS Setup Status - 2026-05-19

## Server

- Provider: Hetzner Cloud
- Project: Default
- Server name: `gc-hermes-01`
- Public IPv4: `178.105.148.160`
- Tailscale IPv4: `100.105.214.55`
- Tailscale DNS: `gc-hermes-01.tail4c8459.ts.net`
- Location: Falkenstein, Germany
- Plan: CPX32
- OS: Ubuntu 24.04.4 LTS
- Monthly shown at creation: `$17.09/mo` excluding VAT
- Backups: off

## Base Setup Completed

- SSH key created locally at `~/.ssh/gc-hermes-hetzner`.
- Non-root user `hermes` created.
- SSH public key installed for `root` and `hermes`.
- `ufw` firewall enabled with OpenSSH allowed.
- `fail2ban` enabled.
- `unattended-upgrades` enabled.
- Docker and Docker Compose installed.
- Tailscale installed and approved under `goldencollections9@gmail.com`.
- Tailscale SSH enabled.
- Old stale Tailscale device removed after rebuild; current MagicDNS name is clean again: `gc-hermes-01.tail4c8459.ts.net`.

## Hermes Setup Completed

- Hermes Agent installed as Linux user `hermes`.
- Installed version: `Hermes Agent v0.14.0`.
- Install path: `/home/hermes/.hermes/hermes-agent`.
- Config path: `/home/hermes/.hermes/config.yaml`.
- Env path: `/home/hermes/.hermes/.env`.
- Memory/log paths: `/home/hermes/.hermes/memories`, `/home/hermes/.hermes/logs`, `/home/hermes/.hermes/sessions`.
- `ripgrep` and `ffmpeg` installed.
- Browser tooling verified after rebuild:
  - `hermes doctor` shows `Playwright Chromium (browser engine)` installed.
  - `hermes doctor` shows `browser` tool available.
  - `agent-browser` launched `https://example.com` successfully with `AGENT_BROWSER_ARGS=--no-sandbox`.
- Doppler CLI installed on the VPS.
- Dedicated Doppler project/config created for Hermes: `gc-hermes-agent` / `prd`.
- A read-only Doppler service token named `gc-hermes-01-read` is configured on the server for the Linux `hermes` user.
- Hermes baseline runtime config is stored in Doppler:
  - `HERMES_INFERENCE_PROVIDER=openai-codex`
  - `HERMES_INFERENCE_MODEL=gpt-5.4-mini`
  - `GOLDEN_CONTEXT_DIR=/opt/gc-hermes/context`
  - `HERMES_AUTONOMY_LEVEL=read_only`
  - `HERMES_OWNER_APPROVAL_REQUIRED=true`
- Hermes local config default now points to provider `openai-codex`, model `gpt-5.4-mini`.
- OpenAI Codex OAuth is logged in.
- Smoke test passed: Hermes returned `Hermes is connected.`
- First read-only Golden Collections owner brief completed from `/opt/gc-hermes/context` with no sending, no Shopify edits, and no external business API actions.
- Node/NPM are symlinked into `~/.local/bin` for non-interactive SSH sessions.
- Telegram owner-control gateway configured for private DM with allowed Telegram IDs `8601210897` and `8552935024`.
- Telegram gateway is running as a custom Doppler-aware systemd service: `gc-hermes-gateway.service`.
- Telegram bot token was rotated after setup and updated in Doppler.
- Hermes operating inputs are now deployed: `SOUL.md`, durable memory, owner profile, project context at `/opt/gc-hermes/context/.hermes.md`, and a read-only daily owner brief prompt.
- Hermes cron job `Golden Collections Daily Owner Brief` is active for 9:00 AM India time delivery to Telegram owner DM.

## Known Issues / Next Steps

- Verification on 2026-05-19 confirmed Tailscale is running, with server IP `100.105.214.55` and DNS `gc-hermes-01.tail4c8459.ts.net`.
- Model auth is working through `openai-codex` OAuth. Continue treating this as a controlled pilot; if reliability or usage limits become a problem, use an explicit API/provider key instead.
- Doppler project `gc-whatsapp-automation`, config `prd`, now holds the approved WhatsApp/support-email/Supabase-service/Shopify-webhook/cron runtime keys, including `SUPABASE_URL`. Do not copy raw secret values into the wiki or status files.
- Browser tools were blocked on Ubuntu 26.04. The server was rebuilt to Ubuntu 24.04.4 LTS, and the browser tool is now available.
- Keep `AGENT_BROWSER_ARGS=--no-sandbox` in `/home/hermes/.hermes/.env` for headless Chromium on this server.
- Do not enable broad autonomy. Use the pilot guardrails in `knowledge-base/ops/hermes-agent-guardrails.md`.
- Curated operating memory has been synced to `/opt/gc-hermes/context` on the server.
- Telegram is the first messaging gateway. Keep it owner-only and read-only before adding WhatsApp control or any customer-facing automation.
- Review the first Hermes daily owner brief after it arrives and tune the prompt if it is noisy, repetitive, or too long.

## Useful Commands

SSH from local machine:

```bash
ssh -i ~/.ssh/gc-hermes-hetzner hermes@178.105.148.160
```

Run Hermes:

```bash
export PATH="$HOME/.local/bin:$HOME/.hermes/node/bin:$PATH"
hermes --version
hermes doctor
hermes setup
```
