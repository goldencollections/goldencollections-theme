import fs from "fs";
import path from "path";

const envPath = path.join(process.cwd(), "env");
if (fs.existsSync(envPath)) {
  const envText = fs.readFileSync(envPath, "utf8");
  for (const line of envText.split(/\r?\n/)) {
    const match = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)=(.*)\s*$/);
    if (match && !process.env[match[1]]) {
      process.env[match[1]] = match[2].replace(/^['"]|['"]$/g, "");
    }
  }
}

const SHOP = process.env.SHOPIFY_STORE_DOMAIN;
const TOKEN = process.env.SHOPIFY_ADMIN_TOKEN;
const API_VERSION = process.env.SHOPIFY_API_VERSION || "2026-04";

if (!SHOP || !TOKEN) {
  throw new Error("Missing SHOPIFY_STORE_DOMAIN or SHOPIFY_ADMIN_TOKEN in env");
}

const endpoint = `https://${SHOP}/admin/api/${API_VERSION}/graphql.json`;

async function gql(query, variables = {}) {
  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Shopify-Access-Token": TOKEN,
    },
    body: JSON.stringify({ query, variables }),
  });
  const json = await response.json();
  if (!response.ok || json.errors) {
    throw new Error(JSON.stringify({ status: response.status, errors: json.errors }, null, 2));
  }
  return json.data;
}

const section = `<section style="margin-bottom: 50px;">
<h2 style="font-family: 'New York','Times New Roman',serif; font-size: 2rem; color: #2c2c2c; border-bottom: 3px solid #b59f4f; padding-bottom: 10px; margin-bottom: 25px;">Pinterest API and Pinterest-derived data</h2>
<p style="margin-bottom: 20px;">Golden Collections may use the Pinterest API to let authorized Golden Collections staff connect a Pinterest account, select boards, prepare Pins, publish owner-approved Pins, and read basic Pinterest account, board, Pin, and API response information needed for that publishing workflow.</p>
<p style="margin-bottom: 20px;">Golden Collections is not endorsed by, certified by, affiliated with, or sponsored by Pinterest. Pinterest is a trademark of Pinterest, Inc.</p>
<p style="margin-bottom: 20px;">We use Pinterest-derived data only to operate, audit, troubleshoot, and improve our own Pinterest publishing workflow for Golden Collections. We do not sell, rent, resell, redistribute, or share Pinterest content or Pinterest-derived data with third parties for their independent use.</p>
<p style="margin-bottom: 20px;">If a Pinterest account is disconnected or authorization is revoked, we stop using the Pinterest API for that account. We delete or anonymize stored Pinterest access tokens and Pinterest-derived operational data that is no longer needed for security, audit, legal, troubleshooting, or recordkeeping purposes. Routine deletion is completed within 30 days of a verified request or disconnection unless a longer retention period is required by law or necessary to protect our systems, prevent abuse, resolve disputes, or maintain business records.</p>
<p>Public Pins already published to Pinterest remain on Pinterest unless they are deleted or edited from Pinterest or through available Pinterest tools.</p>
</section>`;

const policiesData = await gql(`
  query {
    shop {
      shopPolicies {
        id
        title
        type
        url
        body
      }
    }
  }
`);

const privacy = policiesData.shop.shopPolicies.find((policy) => policy.type === "PRIVACY_POLICY");
if (!privacy) {
  throw new Error("Privacy policy not found");
}

if (/Pinterest API and Pinterest-derived data/i.test(privacy.body)) {
  console.log(JSON.stringify({
    status: "already_updated",
    title: privacy.title,
    url: privacy.url,
    bodyLength: privacy.body.length,
  }, null, 2));
  process.exit(0);
}

fs.mkdirSync(path.join("tmp", "pinterest-policy-fix"), { recursive: true });
fs.writeFileSync(path.join("tmp", "pinterest-policy-fix", "privacy-policy-before.html"), privacy.body);

let nextBody = privacy.body.replace(/Last Updated:\s*2025/i, "Last Updated: 2026");
if (nextBody.includes("<section style=\"margin-bottom: 50px; background: #f9f9f9;")) {
  nextBody = nextBody.replace("<section style=\"margin-bottom: 50px; background: #f9f9f9;", `${section}\n<section style=\"margin-bottom: 50px; background: #f9f9f9;`);
} else {
  nextBody = nextBody.replace(/<\/div>\s*$/i, `${section}\n</div>`);
}

fs.writeFileSync(path.join("tmp", "pinterest-policy-fix", "privacy-policy-after.html"), nextBody);

const updateData = await gql(`
  mutation UpdatePrivacyPolicy($shopPolicy: ShopPolicyInput!) {
    shopPolicyUpdate(shopPolicy: $shopPolicy) {
      shopPolicy {
        id
        title
        type
        url
        body
      }
      userErrors {
        field
        message
      }
    }
  }
`, {
  shopPolicy: {
    type: "PRIVACY_POLICY",
    body: nextBody,
  },
});

const result = updateData.shopPolicyUpdate;
if (result.userErrors?.length) {
  throw new Error(JSON.stringify(result.userErrors, null, 2));
}

console.log(JSON.stringify({
  status: "updated",
  id: result.shopPolicy.id,
  title: result.shopPolicy.title,
  type: result.shopPolicy.type,
  url: result.shopPolicy.url,
  bodyLength: result.shopPolicy.body.length,
  hasPinterestApiSection: /Pinterest API and Pinterest-derived data/i.test(result.shopPolicy.body),
}, null, 2));
