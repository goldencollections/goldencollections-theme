# Hermes Wiki Sync Verification - 2026-05-20

## Result

Hermes now has the Golden Collections wiki folder in its runtime context.

Verified remote path:

- `/opt/gc-hermes/context/knowledge-base/wiki/`

Verified files:

- 22 Markdown files copied from local `knowledge-base/wiki/`
- SHA-256 hashes matched between local files and VPS files after sync

## Why This Matters

Hermes was already instructed to treat `knowledge-base/wiki/` as stable business truth, but the wiki folder itself was missing from the VPS context folder. That meant Hermes could read the operating instructions and source map, but not the actual stable wiki pages those instructions pointed to.

This is now corrected.

## Future Sync Rule

After meaningful wiki updates, run:

```powershell
.\scripts\sync-hermes-knowledge.ps1
```

The script copies the local wiki files to Hermes and verifies matching hashes.

## Guardrail

Do not let generated outputs become wiki truth automatically. Promote only verified facts into `knowledge-base/wiki/`, then sync to Hermes.
