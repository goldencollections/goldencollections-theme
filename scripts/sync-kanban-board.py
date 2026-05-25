#!/usr/bin/env python3
"""Sync Golden Collections Kanban between Hermes SQLite and repo files.

Hermes is authoritative for live task status. Repo files are the durable
backup/export and a controlled import source for new/planned cards.
"""

from __future__ import annotations

import argparse
import json
import secrets
import sqlite3
import sys
import time
from dataclasses import dataclass
from datetime import datetime
from pathlib import Path


ROOT = Path.cwd()
OPS_DIR = ROOT / "knowledge-base" / "ops"
BOARD_MD = OPS_DIR / "kanban-board.md"
CARDS_JSON = OPS_DIR / "kanban-cards.json"
DEFAULT_BOARD = "goldencollections"

ORDER = ["triage", "todo", "ready", "running", "blocked", "review", "done"]
SECTION_BY_STATUS = {
    "triage": "Triage",
    "todo": "Todo",
    "ready": "Ready",
    "running": "Running",
    "blocked": "Blocked",
    "review": "Review",
    "done": "Done",
}


@dataclass
class Card:
    id: str
    title: str
    status: str
    owner: str
    area: str
    body: str
    next_action: str
    acceptance: str
    evidence: list[str]
    blocked_reason: str | None = None
    result: str | None = None

    def to_json(self) -> dict:
        data = {
            "id": self.id,
            "title": self.title,
            "status": self.status,
            "owner": self.owner,
            "area": self.area,
            "next_action": self.next_action,
            "acceptance": self.acceptance,
            "evidence": self.evidence,
            "body": self.body,
        }
        if self.blocked_reason:
            data["blocked_reason"] = self.blocked_reason
        if self.result:
            data["result"] = self.result
        return data


def db_path(board: str) -> Path:
    home = Path.home()
    if board == "default":
        return home / ".hermes" / "kanban.db"
    return home / ".hermes" / "kanban" / "boards" / board / "kanban.db"


def connect(board: str) -> sqlite3.Connection:
    path = db_path(board)
    if not path.exists():
        raise SystemExit(f"Hermes board DB not found: {path}")
    conn = sqlite3.connect(path)
    conn.row_factory = sqlite3.Row
    return conn


def extract_field(body: str, name: str, default: str = "") -> str:
    prefix = f"{name}:"
    for line in body.splitlines():
        stripped = line.strip()
        if stripped.startswith("- "):
            stripped = stripped[2:].strip()
        if stripped.lower().startswith(prefix.lower()):
            return stripped[len(prefix) :].strip()
    return default


def extract_evidence(body: str) -> list[str]:
    lines = body.splitlines()
    evidence: list[str] = []
    in_evidence = False
    for line in lines:
        stripped = line.strip()
        if stripped.lower() in {"evidence:", "- evidence:"}:
            in_evidence = True
            continue
        if in_evidence:
            if stripped.startswith("- "):
                evidence.append(stripped[2:].strip())
                continue
            if stripped and not stripped.startswith(" "):
                break
    inline = extract_field(body, "Evidence")
    if inline and not evidence:
        evidence = [item.strip() for item in inline.split(",") if item.strip()]
    return evidence


def title_without_id(full_title: str, card_id: str) -> str:
    prefix = f"{card_id} - "
    return full_title[len(prefix) :] if full_title.startswith(prefix) else full_title


def load_hermes_cards(board: str) -> list[Card]:
    conn = connect(board)
    rows = conn.execute(
        """
        SELECT idempotency_key, title, body, assignee, status, result
        FROM tasks
        WHERE status != 'archived'
          AND idempotency_key LIKE 'GC-%'
        ORDER BY created_at, id
        """
    ).fetchall()
    conn.close()
    cards: list[Card] = []
    for row in rows:
        body = row["body"] or ""
        card_id = row["idempotency_key"]
        cards.append(
            Card(
                id=card_id,
                title=title_without_id(row["title"], card_id),
                status=row["status"],
                owner=row["assignee"] or extract_field(body, "Owner", "manual"),
                area=extract_field(body, "Area", "operations"),
                body=body,
                next_action=extract_field(body, "Next action", "Review this card in Hermes and add the next action."),
                acceptance=extract_field(body, "Acceptance", "Acceptance criteria not recorded yet."),
                evidence=extract_evidence(body),
                blocked_reason=extract_field(body, "Blocked reason") or extract_field(body, "Blocked by") or None,
                result=row["result"],
            )
        )
    return cards


def load_repo_cards() -> list[dict]:
    if not CARDS_JSON.exists():
        raise SystemExit(f"Repo card file not found: {CARDS_JSON}")
    return json.loads(CARDS_JSON.read_text(encoding="utf-8"))


def render_card(card: Card) -> str:
    title = f"### {card.id} - {card.title}"
    lines = [
        title,
        "",
        f"- Owner: {card.owner}",
        f"- Area: {card.area}",
    ]
    if card.status == "done":
        lines.append(f"- Result: {card.result or card.next_action}")
    elif card.status == "blocked":
        lines.append(f"- Blocked by: {card.blocked_reason or 'Blocker not recorded.'}")
        lines.append(f"- Next action: {card.next_action}")
    else:
        lines.append(f"- Next action: {card.next_action}")
    lines.append(f"- Acceptance: {card.acceptance}")
    if card.evidence:
        lines.append("- Evidence:")
        lines.extend(f"  - {item}" for item in card.evidence)
    return "\n".join(lines)


def render_markdown(cards: list[Card]) -> str:
    grouped = {status: [] for status in ORDER}
    for card in cards:
        grouped.setdefault(card.status, []).append(card)

    parts = [
        "# Golden Collections Kanban Board",
        "",
        f"Last exported from Hermes: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}",
        "",
        "Hermes is authoritative for live task status. This repo file is the durable backup/export and Codex-readable context.",
        "",
        "Environment note: Codex and Hermes may run in separate filesystems. Use GitHub as the bridge and follow `knowledge-base/ops/codex-hermes-environments.md` before treating an empty local board as authoritative.",
        "",
        "## Operating Rule",
        "",
        "A task is not finished until the board is updated.",
        "",
        "Every Codex or Hermes session must close with a board update:",
        "",
        "- update Hermes Kanban first",
        "- export Hermes to the repo with `python scripts/sync-kanban-board.py export`",
        "- pull/import the repo backup first when switching machines or agent environments",
        "- create cards for new open loops found during the session",
        "- mark blockers with the exact blocking reason",
        "- add verification notes, output files, URLs, or command evidence",
        "",
        "## Sync Rule",
        "",
        "- Hermes live board is the source of truth for current status.",
        "- Repo export is the backup and Codex context.",
        "- Repo-to-Hermes import is controlled: it creates/updates planned card details, but preserves existing Hermes statuses unless `--apply-status` is used.",
        "- If there is a conflict, Hermes wins unless the owner explicitly says the repo version is newer.",
        "",
        "## Columns",
        "",
        "- `Triage`: captured but not yet shaped into a clear task",
        "- `Todo`: accepted work, not yet ready to execute",
        "- `Ready`: clear next action exists",
        "- `Running`: actively being worked",
        "- `Blocked`: waiting on owner input, credentials, external approval, cache, or data",
        "- `Review`: agent says done; human or later verification needed",
        "- `Done`: completed with evidence",
    ]

    for status in ORDER:
        if not grouped.get(status):
            continue
        parts.extend(["", f"## {SECTION_BY_STATUS.get(status, status.title())}", ""])
        parts.append("\n\n".join(render_card(card) for card in grouped[status]))

    parts.extend(
        [
            "",
            "## Commands",
            "",
            "```powershell",
            "hermes kanban boards switch goldencollections",
            "hermes kanban list",
            "python scripts/sync-kanban-board.py status",
            "python scripts/sync-kanban-board.py export",
            "python scripts/sync-kanban-board.py import",
            "```",
            "",
        ]
    )
    return "\n".join(parts)


def export_repo(args: argparse.Namespace) -> None:
    cards = load_hermes_cards(args.board)
    OPS_DIR.mkdir(parents=True, exist_ok=True)
    CARDS_JSON.write_text(json.dumps([card.to_json() for card in cards], indent=2) + "\n", encoding="utf-8", newline="\n")
    BOARD_MD.write_text(render_markdown(cards), encoding="utf-8", newline="\n")
    print(f"Exported {len(cards)} Hermes cards to {BOARD_MD} and {CARDS_JSON}")


def make_task_id(conn: sqlite3.Connection) -> str:
    while True:
        task_id = f"t_{secrets.token_hex(4)}"
        found = conn.execute("SELECT 1 FROM tasks WHERE id = ?", (task_id,)).fetchone()
        if not found:
            return task_id


def body_from_repo(card: dict) -> str:
    if card.get("body"):
        return str(card["body"]).strip()
    lines = [
        f"Area: {card.get('area', 'operations')}",
        f"Owner: {card.get('owner', 'manual')}",
        f"Status from repo board: {card.get('status', 'ready')}",
        "",
        f"Next action: {card.get('next_action', 'Review this card and add the next action.')}",
        "",
        f"Acceptance: {card.get('acceptance', 'Acceptance criteria not recorded yet.')}",
    ]
    if card.get("blocked_reason"):
        lines.extend(["", f"Blocked reason: {card['blocked_reason']}"])
    if card.get("evidence"):
        lines.extend(["", "Evidence:"])
        lines.extend(f"- {item}" for item in card["evidence"])
    return "\n".join(lines)


def import_repo(args: argparse.Namespace) -> None:
    repo_cards = load_repo_cards()
    conn = connect(args.board)
    now = int(time.time())
    created = 0
    updated = 0
    status_updates = 0
    for card in repo_cards:
        card_id = card["id"]
        row = conn.execute("SELECT id, status FROM tasks WHERE idempotency_key = ?", (card_id,)).fetchone()
        title = f"{card_id} - {card['title']}"
        body = body_from_repo(card)
        owner = card.get("owner", "manual")
        desired_status = card.get("status", "ready")
        if row:
            conn.execute(
                "UPDATE tasks SET title = ?, body = ?, assignee = ? WHERE id = ?",
                (title, body, owner, row["id"]),
            )
            updated += 1
            if args.apply_status and row["status"] != desired_status:
                conn.execute(
                    "UPDATE tasks SET status = ?, completed_at = CASE WHEN ? = 'done' THEN COALESCE(completed_at, ?) ELSE NULL END WHERE id = ?",
                    (desired_status, desired_status, now, row["id"]),
                )
                status_updates += 1
            task_id = row["id"]
        else:
            task_id = make_task_id(conn)
            conn.execute(
                """
                INSERT INTO tasks(
                  id, title, body, assignee, status, priority, created_by,
                  created_at, workspace_kind, idempotency_key, skills
                )
                VALUES (?, ?, ?, ?, ?, 0, 'repo-sync', ?, 'scratch', ?, '[]')
                """,
                (task_id, title, body, owner, desired_status, now, card_id),
            )
            created += 1
        conn.execute(
            "INSERT INTO task_events(task_id, kind, payload, created_at) VALUES (?, 'repo_sync_import', ?, ?)",
            (task_id, json.dumps({"repo_id": card_id, "apply_status": args.apply_status}), now),
        )
    conn.commit()
    conn.close()
    print(f"Imported repo cards into Hermes: created={created}, updated={updated}, status_updates={status_updates}")
    if not args.apply_status:
        print("Existing Hermes statuses were preserved. Use --apply-status only for intentional restore/import.")


def status(args: argparse.Namespace) -> None:
    hermes_cards = {card.id: card for card in load_hermes_cards(args.board)}
    repo_cards = {card["id"]: card for card in load_repo_cards()} if CARDS_JSON.exists() else {}
    hermes_only = sorted(set(hermes_cards) - set(repo_cards))
    repo_only = sorted(set(repo_cards) - set(hermes_cards))
    status_drift = []
    for card_id in sorted(set(hermes_cards) & set(repo_cards)):
        if hermes_cards[card_id].status != repo_cards[card_id].get("status"):
            status_drift.append((card_id, hermes_cards[card_id].status, repo_cards[card_id].get("status")))
    print(f"Hermes cards: {len(hermes_cards)}")
    print(f"Repo cards:   {len(repo_cards)}")
    print(f"Hermes-only:  {len(hermes_only)}")
    print(f"Repo-only:    {len(repo_only)}")
    print(f"Status drift: {len(status_drift)}")
    for card_id in hermes_only[:20]:
        print(f"  Hermes-only: {card_id} {hermes_cards[card_id].status} {hermes_cards[card_id].title}")
    for card_id in repo_only[:20]:
        print(f"  Repo-only: {card_id} {repo_cards[card_id].get('status')} {repo_cards[card_id].get('title')}")
    for card_id, hermes_status, repo_status in status_drift[:30]:
        print(f"  Status: {card_id} Hermes={hermes_status} Repo={repo_status}")
    if status_drift:
        print("Hermes is authoritative. Run `python scripts/sync-kanban-board.py export` to refresh repo status.")


def main() -> int:
    parser = argparse.ArgumentParser(description="Sync Golden Collections Kanban between Hermes and repo files.")
    parser.add_argument("--board", default=DEFAULT_BOARD, help="Hermes board slug")
    sub = parser.add_subparsers(dest="command", required=True)

    def add_board_arg(subparser: argparse.ArgumentParser) -> None:
        subparser.add_argument("--board", default=argparse.SUPPRESS, help="Hermes board slug")

    export_parser = sub.add_parser("export", help="Export Hermes board to repo markdown and JSON")
    add_board_arg(export_parser)
    import_parser = sub.add_parser("import", help="Import repo cards into Hermes")
    add_board_arg(import_parser)
    import_parser.add_argument("--apply-status", action="store_true", help="Also overwrite existing Hermes statuses from repo")
    status_parser = sub.add_parser("status", help="Show drift between Hermes and repo")
    add_board_arg(status_parser)
    args = parser.parse_args()
    if args.command == "export":
        export_repo(args)
    elif args.command == "import":
        import_repo(args)
    elif args.command == "status":
        status(args)
    return 0


if __name__ == "__main__":
    sys.exit(main())
