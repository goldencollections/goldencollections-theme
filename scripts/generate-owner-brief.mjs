import fs from "fs";
import path from "path";

const root = process.cwd();
const opsDir = path.join(root, "knowledge-base", "ops");
const briefsDir = path.join(opsDir, "briefs");
const updateCurrent = process.argv.includes("--update-current");

function read(relativePath) {
  const filePath = path.join(root, relativePath);
  if (!fs.existsSync(filePath)) return "";
  return fs.readFileSync(filePath, "utf8").trim();
}

function write(relativePath, content) {
  const filePath = path.join(root, relativePath);
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, `${content.trim()}\n`, "utf8");
  return filePath;
}

function localDate() {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Kolkata",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date());
  const byType = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  return `${byType.year}-${byType.month}-${byType.day}`;
}

function section(markdown, title) {
  const escaped = title.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const match = markdown.match(new RegExp(`(?:^|\\r?\\n)## ${escaped}\\r?\\n([\\s\\S]*?)(?=\\r?\\n## |$)`));
  return match ? match[1].trim() : "";
}

function firstBullets(markdown, title, limit = 5) {
  const body = section(markdown, title);
  return body
    .split(/\r?\n/)
    .filter((line) => line.trim().startsWith("- "))
    .slice(0, limit)
    .join("\n");
}

function blockOrFallback(value, fallback) {
  return value && value.trim() ? value.trim() : fallback;
}

const today = process.env.BRIEF_DATE || localDate();
const ownerBrief = read("knowledge-base/ops/owner-brief.md");
const openLoops = read("knowledge-base/ops/open-loops.md");
const decisions = read("knowledge-base/ops/decisions.md");
const program = read("knowledge-base/ops/golden-collections-program.md");
const quality = read("knowledge-base/ops/knowledge-quality-rules.md");
const shotList = read("knowledge-base/ops/proof-asset-shot-list.md");

const primaryAction = blockOrFallback(
  section(ownerBrief, "Best Action Now"),
  "No current best action found. Read the ops source map and choose one business-focused action before executing.",
);
const why = blockOrFallback(
  section(ownerBrief, "Why This Matters"),
  "No rationale found. The brief should explain how the action supports sales, trust, search visibility, customer clarity, or owner time.",
);
const ownerAction = blockOrFallback(
  section(ownerBrief, "Owner Action Needed"),
  "No owner action currently recorded.",
);
const codexAction = blockOrFallback(
  section(ownerBrief, "Codex Action After Assets Exist"),
  "No Codex follow-up action currently recorded.",
);
const doNotDo = blockOrFallback(
  section(ownerBrief, "Do Not Do Yet"),
  "- Do not send customer-facing messages.\n- Do not publish unverified claims.\n- Do not build software for its own sake.",
);

const searchLoops = firstBullets(openLoops, "Search, GEO, And Authority", 11);
const merchantLoops = firstBullets(openLoops, "Merchant Center And Product Feed", 6);
const proofLoops = firstBullets(openLoops, "Varalakshmi And Proof Pipeline", 5);
const reviewLoops = firstBullets(openLoops, "Reviews", 4);
const automationLoops = firstBullets(openLoops, "WhatsApp And Support Email", 4);

const brief = `# Golden Collections Owner Brief

Date: ${today}

## Best Action Now

${primaryAction}

## Why This Matters

${why}

## Owner Action Needed

${ownerAction}

## Codex Action After Assets Exist

${codexAction}

## Open Loops To Watch

### Search, GEO, And Authority

${searchLoops || "- No search/authority open loops found."}

### Merchant Center And Product Feed

${merchantLoops || "- No Merchant/product feed open loops found."}

### Varalakshmi And Proof Pipeline

${proofLoops || "- No Varalakshmi/proof open loops found."}

### Reviews

${reviewLoops || "- No review open loops found."}

### WhatsApp And Support Email

${automationLoops || "- No WhatsApp/support email open loops found."}

## Do Not Do Yet

${doNotDo}

## Source Files Read

- \`knowledge-base/ops/owner-brief.md\`
- \`knowledge-base/ops/open-loops.md\`
- \`knowledge-base/ops/decisions.md\`
- \`knowledge-base/ops/golden-collections-program.md\`
- \`knowledge-base/ops/knowledge-quality-rules.md\`
- \`knowledge-base/ops/proof-asset-shot-list.md\`
`;

const contextPack = `# Golden Collections Ops Context Pack

Generated: ${new Date().toISOString()}

Use this compact pack to orient Codex or a future assistant without rereading the whole repo.

## Current Owner Brief

${brief}

## Durable Decisions

${section(decisions, "Operating System And Memory")}

${section(decisions, "Automation Philosophy")}

${section(decisions, "Business Focus")}

${section(decisions, "Entity And Public Claims")}

${section(decisions, "Product And Content Language")}

## Quality Guardrails

${section(quality, "Public-Use Rule")}

${section(quality, "Contradiction Check")}

${section(quality, "Do-Not-Say List")}

## Operating Rules

${section(program, "Operating Rules")}

${section(program, "Approval Required")}

${section(program, "Never Do")}

## Current Proof Asset Shot List

${shotList}
`;

const briefPath = write(`knowledge-base/ops/briefs/${today}-auto-owner-brief.md`, brief);
const contextPath = write("knowledge-base/ops/context-pack.md", contextPack);
let currentPath = null;

if (updateCurrent) {
  currentPath = write("knowledge-base/ops/owner-brief.md", brief);
}

console.log(
  JSON.stringify(
    {
      date: today,
      briefPath,
      contextPath,
      currentPath,
      updateCurrent,
    },
    null,
    2,
  ),
);
