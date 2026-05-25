# Hermes Telegram Voice Input Setup - 2026-05-20

Goal: allow the owner to send Telegram voice notes to Hermes and receive normal text replies, without enabling audio output or paid speech APIs.

## Enabled

- Installed `faster-whisper` inside the Hermes Python virtualenv on `gc-hermes-01`.
- Verified Hermes STT config resolves to provider `local`.
- Verified local transcription smoke test returns `provider: local`.
- Patched the Hermes gateway so cached voice audio is deleted after transcription by default.
- Patched the Telegram gateway to block video/video-file inputs before they reach Hermes, with a short notice asking for a voice note or audio-only message.
- Restarted `gc-hermes-gateway.service`; systemd brought it back under new process IDs.

## Boundaries

- Telegram allowed users only: owner and brother IDs already configured.
- Voice input only.
- Video input disabled.
- Text replies only.
- No OpenAI/ElevenLabs/Google paid audio API.
- Do not store raw audio as memory.
- Do not enable auto-TTS or spoken replies unless the owner explicitly approves a later phase.

## Operational Note

The first real Telegram voice note may be slower than a typed message because local Whisper runs on the VPS CPU. Short commands are the intended use case.

If Hermes Agent is upgraded later, recheck that cached voice audio is still deleted after transcription; the safety patch lives in the installed gateway code.
