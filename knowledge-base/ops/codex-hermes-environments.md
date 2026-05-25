# Codex and Hermes Environment Sync

Last updated: 2026-05-25

## Core Rule

Codex and Hermes may run in different local environments. Do not assume they share a filesystem.

- Codex desktop workspace on Anil's Windows machine: `C:\goldencollections-theme`
- Hermes may run in a separate Linux environment with its own `$HOME`, repo clone, and Hermes Kanban database.
- GitHub is the bridge between the two environments: `https://github.com/goldencollections/goldencollections-theme`

If Hermes says a board is empty while Codex sees cards, first suspect that Hermes is looking at its own Linux board database and has not imported the repo backup yet.

## Source Of Truth

- Hermes Kanban is the live source of truth for task status inside the environment where Hermes is working.
- The repo files are the durable cross-environment backup:
  - `knowledge-base/ops/kanban-cards.json`
  - `knowledge-base/ops/kanban-board.md`
- Codex and Hermes must sync through GitHub, not through direct local paths.

## Required Start Of Hermes Session

At the start of any Hermes session for Golden Collections, Hermes should make sure it has the repo and import the latest Kanban backup before reporting board status:

```bash
cd ~

if [ ! -d goldencollections-theme/.git ]; then
  git clone https://github.com/goldencollections/goldencollections-theme.git
fi

cd ~/goldencollections-theme
git pull origin main

python3 scripts/sync-kanban-board.py import --apply-status --board goldencollections
python3 scripts/sync-kanban-board.py status --board goldencollections
```

If `python3` is not available, use `python`.

The shorter supported command after the repo exists is:

```bash
cd ~/goldencollections-theme
bash scripts/hermes-kanban-bootstrap.sh
```

## Required End Of Hermes Session

At the end of any Hermes session that changes cards:

```bash
cd ~/goldencollections-theme
python3 scripts/sync-kanban-board.py export --board goldencollections
git status --short
```

If repo files changed, Hermes should commit and push the Kanban export so Codex can pull it:

```bash
git add knowledge-base/ops/kanban-board.md knowledge-base/ops/kanban-cards.json
git commit -m "Update Hermes Kanban export"
git push origin main
```

If Hermes cannot push, it must tell the owner that the board was updated locally but the repo backup is not current.

## Required Start Of Codex Session

At the start of a Codex session that depends on Kanban state:

```powershell
cd C:\goldencollections-theme
git pull origin main
python scripts\sync-kanban-board.py import --apply-status --board goldencollections
python scripts\sync-kanban-board.py status --board goldencollections
```

## Required End Of Codex Session

At the end of any Codex session that changes cards:

```powershell
cd C:\goldencollections-theme
python scripts\sync-kanban-board.py export --board goldencollections
git add knowledge-base\ops\kanban-board.md knowledge-base\ops\kanban-cards.json
git commit -m "Update Golden Collections Kanban"
git push origin main
```

When Codex also changes task evidence files, include those files in the same commit.

## Recovery If Hermes Says The Board Is Empty

Do not recreate cards manually. Run:

```bash
cd ~/goldencollections-theme || {
  cd ~
  git clone https://github.com/goldencollections/goldencollections-theme.git
  cd ~/goldencollections-theme
}

git pull origin main
python3 scripts/sync-kanban-board.py import --apply-status --board goldencollections
python3 scripts/sync-kanban-board.py status --board goldencollections
```

Expected result after the 2026-05-25 intake is roughly 36 active Golden Collections cards, unless newer sessions have changed the board.

## Owner Instruction

If an agent says `default` board, `empty board`, or `task count: 0`, tell it:

```text
Use the Golden Collections GitHub repo as the bridge. Clone or pull
https://github.com/goldencollections/goldencollections-theme, then import
knowledge-base/ops/kanban-cards.json into the goldencollections Hermes board.
Do not use the default board.
```
