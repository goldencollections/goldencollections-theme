#!/usr/bin/env node
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const OUT_DIR = path.join(root, "tmp", "ucp-cart-checkout-readiness");
const BUSINESS = "https://www.goldencollections.com";
const NPX = process.platform === "win32" ? "npx.cmd" : "npx";
const LABEL = argValue("--label") || new Date().toISOString().slice(0, 10);
const variantId = argValue("--variant") || "gid://shopify/ProductVariant/48924974580010";

fs.mkdirSync(OUT_DIR, { recursive: true });

const summary = {
  generatedAt: new Date().toISOString(),
  label: LABEL,
  business: BUSINESS,
  variantId,
  cart: null,
  checkout: null
};

summary.cart = runUcp("cart", "create", [
  "--set-string",
  `/line_items/0/item/id=${variantId}`,
  "--set",
  "/line_items/0/quantity=1",
  "--set",
  "/context/address_country=IN",
  "--set",
  "/context/currency=INR"
]);

const cartId = findId(summary.cart.parsed, "cart");
if (summary.cart.status === "ok" && cartId) {
  summary.checkout = runUcp("checkout", "create", [
    "--set-string",
    `/cart_id=${cartId}`,
    "--set",
    "/line_items=[]"
  ]);
} else {
  summary.checkout = {
    status: "skipped",
    reason: summary.cart.status === "ok" ? "Cart response did not include a cart id" : "Cart creation failed"
  };
}

const jsonPath = path.join(OUT_DIR, `${LABEL}.json`);
fs.writeFileSync(jsonPath, `${JSON.stringify(summary, null, 2)}\n`);
console.log(`Wrote ${path.relative(root, jsonPath)}`);
console.log(JSON.stringify({
  cartStatus: summary.cart.status,
  cartId,
  checkoutStatus: summary.checkout.status,
  checkoutId: findId(summary.checkout.parsed, "checkout")
}, null, 2));

function runUcp(resource, action, inputArgs) {
  try {
    const output = execFileSync(
      NPX,
      [
        "@shopify/ucp-cli",
        resource,
        action,
        "--business",
        BUSINESS,
        ...inputArgs,
        "--format",
        "json",
        "--token-limit",
        "5000"
      ],
      { cwd: root, encoding: "utf8", stdio: ["ignore", "pipe", "pipe"], shell: process.platform === "win32" }
    );
    return { status: "ok", parsed: JSON.parse(output), raw: output };
  } catch (error) {
    let parsed = null;
    const raw = String(error.stdout || error.stderr || error.message || "");
    try {
      parsed = JSON.parse(raw);
    } catch {
      parsed = null;
    }
    return {
      status: "error",
      exitCode: error.status ?? null,
      parsed,
      raw
    };
  }
}

function findId(parsed, type) {
  const result = parsed?.result || parsed;
  const direct = result?.[type]?.id || result?.id;
  if (direct) return direct;
  if (type === "cart") return result?.cart_id || result?.cartId || "";
  if (type === "checkout") return result?.checkout_id || result?.checkoutId || "";
  return "";
}

function argValue(flag) {
  const exact = process.argv.find((arg) => arg.startsWith(`${flag}=`));
  if (exact) return exact.slice(flag.length + 1);
  const index = process.argv.indexOf(flag);
  return index === -1 ? "" : process.argv[index + 1] || "";
}
