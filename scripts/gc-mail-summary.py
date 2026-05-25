#!/usr/bin/env python3
import email
import imaplib
import json
import os
import re
from email.header import decode_header, make_header
from email.utils import parsedate_to_datetime

SYSTEM_SENDER_TOKENS = (
    "no-reply@", "noreply@", "no_reply@", "do-not-reply@", "donotreply@",
    "do_not_reply@", "mailer-daemon@", "postmaster@", "bounce@", "notification@",
)

SYSTEM_DOMAINS = (
    "@shopify.com", "@email.shopify.com", "@shopifyemail.com", "@godaddy.com",
    "@secureserver.net", "@tm.openai.com", "@openai.com", "@facebookmail.com",
)

IMPORTANT_RE = re.compile(
    r"\b(order|tracking|refund|return|exchange|damaged|broken|wrong item|deity|idol|size|fit|measurement|whatsapp|payment|security|password|login|verification|merchant|google|meta|shopify|urgent)\b",
    re.I,
)


def decode_value(value):
    if not value:
        return ""
    try:
        return str(make_header(decode_header(value)))
    except Exception:
        return str(value)


def is_system_sender(sender):
    s = (sender or "").lower()
    return any(token in s for token in SYSTEM_SENDER_TOKENS) or any(domain in s for domain in SYSTEM_DOMAINS)


def parse_header_bytes(raw):
    msg = email.message_from_bytes(raw or b"")
    sender = decode_value(msg.get("From", ""))
    subject = decode_value(msg.get("Subject", ""))
    date_raw = msg.get("Date", "")
    try:
        date = parsedate_to_datetime(date_raw).isoformat()
    except Exception:
        date = date_raw
    return {"from": sender, "subject": subject, "date": date}


def scan_account(label, address, password, host, port=993, limit=20):
    if not address or not password or password.startswith("REPLACE_IN_DOPPLER"):
        return {"label": label, "configured": False, "error": "missing_or_placeholder_credentials", "items": []}

    items = []
    try:
        conn = imaplib.IMAP4_SSL(host, int(port), timeout=25)
        conn.login(address, password)
        try:
            conn.select("INBOX", readonly=True)
            status, data = conn.search(None, "ALL")
            if status != "OK":
                return {"label": label, "configured": True, "error": "search_failed", "items": []}

            ids = data[0].split()[-limit:]
            for msg_id in reversed(ids):
                status, parts = conn.fetch(msg_id, "(FLAGS BODY.PEEK[HEADER.FIELDS (FROM SUBJECT DATE)])")
                if status != "OK" or not parts:
                    continue

                raw = b""
                flags_text = ""
                for part in parts:
                    if isinstance(part, tuple):
                        flags_text += str(part[0])
                        raw += part[1] or b""
                    elif isinstance(part, bytes):
                        flags_text += part.decode("utf-8", "ignore")

                parsed = parse_header_bytes(raw)
                unread = "\\Seen" not in flags_text
                system = is_system_sender(parsed["from"])
                important = unread or bool(IMPORTANT_RE.search(parsed["subject"] or "")) or (label == "support" and not system)

                if important and not (label == "support" and system):
                    items.append({
                        "mailbox": label,
                        "unread": unread,
                        "from": parsed["from"][:120],
                        "subject": (parsed["subject"] or "(no subject)")[:160],
                        "date": parsed["date"],
                    })

            return {"label": label, "configured": True, "error": None, "items": items[:8]}
        finally:
            try:
                conn.logout()
            except Exception:
                pass
    except Exception as exc:
        return {"label": label, "configured": True, "error": type(exc).__name__, "items": []}


def main():
    support = scan_account(
        "support",
        os.getenv("SUPPORT_EMAIL_USERNAME"),
        os.getenv("SUPPORT_EMAIL_PASSWORD"),
        os.getenv("SUPPORT_EMAIL_IMAP_HOST", "imap.secureserver.net"),
        os.getenv("SUPPORT_EMAIL_IMAP_PORT", "993"),
    )
    gmail = scan_account(
        "gmail-admin",
        os.getenv("GMAIL_ADDRESS", "goldencollections9@gmail.com"),
        os.getenv("GMAIL_APP_PASSWORD"),
        os.getenv("GMAIL_IMAP_HOST", "imap.gmail.com"),
        os.getenv("GMAIL_IMAP_PORT", "993"),
    )

    all_items = support["items"] + gmail["items"]
    print(json.dumps({
        "ok": not support["error"] and not gmail["error"],
        "mode": "read_only_headers_only",
        "accounts": [
            {"label": support["label"], "configured": support["configured"], "error": support["error"], "important_count": len(support["items"])},
            {"label": gmail["label"], "configured": gmail["configured"], "error": gmail["error"], "important_count": len(gmail["items"])},
        ],
        "important_items": all_items[:12],
        "safety": "Headers only. No bodies read. No messages marked read. No sending.",
    }, indent=2))


if __name__ == "__main__":
    main()
