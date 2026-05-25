# Golden Collections Kanban Viewer

This is a simple local viewer for the exported Hermes Kanban board.

Run from the repo root:

```powershell
python -m http.server 8787
```

Then open:

```text
http://127.0.0.1:8787/tools/kanban-viewer/
```

The viewer reads:

```text
knowledge-base/ops/kanban-cards.json
```

Hermes remains the source of truth for live status. Export Hermes to the repo before using this page when you want the latest board snapshot:

```powershell
python scripts\sync-kanban-board.py export
```
