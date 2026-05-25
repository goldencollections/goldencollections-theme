import fs from "node:fs";
import path from "node:path";
import { metaApi, requireMetaEnv, root, safeMetaApi } from "./meta-lib.mjs";

const { accessToken, appId, appSecret, businessId, catalogId } = requireMetaEnv();

const checks = [];

checks.push(await safeMetaApi("token_identity", "/me", { fields: "id,name" }));

checks.push(await debugToken());

checks.push(await safeMetaApi("business", `/${businessId}`, {
  fields: "id,name,verification_status,created_time",
}));

checks.push(await safeMetaApi("owned_pages", `/${businessId}/owned_pages`, {
  fields: "id,name,link,fan_count,verification_status,instagram_business_account{id,username,name}",
  limit: 50,
}));

checks.push(await safeMetaApi("owned_ad_accounts", `/${businessId}/owned_ad_accounts`, {
  fields: "id,account_id,name,account_status,currency,timezone_name,disable_reason,amount_spent,balance",
  limit: 50,
}));

checks.push(await safeMetaApi("client_ad_accounts", `/${businessId}/client_ad_accounts`, {
  fields: "id,account_id,name,account_status,currency,timezone_name,disable_reason",
  limit: 50,
}));

checks.push(await safeMetaApi("owned_product_catalogs", `/${businessId}/owned_product_catalogs`, {
  fields: "id,name,product_count,vertical",
  limit: 50,
}));

if (catalogId) {
  checks.push(await safeMetaApi("catalog", `/${catalogId}`, {
    fields: "id,name,product_count,vertical",
  }));
  checks.push(await safeMetaApi("catalog_sample_products", `/${catalogId}/products`, {
    fields: "id,retailer_id,name,availability,condition,price,currency,url,image_url",
    limit: 10,
  }));
}

const report = {
  checked_at: new Date().toISOString(),
  business_id: businessId,
  catalog_id: catalogId || null,
  checks,
  summary: summarize(checks),
};

const outPath = path.join(root, "tmp", `meta-business-diagnostics-${new Date().toISOString().slice(0, 10)}.json`);
fs.mkdirSync(path.dirname(outPath), { recursive: true });
fs.writeFileSync(outPath, JSON.stringify(report, null, 2));

console.log(JSON.stringify({ outputPath: outPath, summary: report.summary }, null, 2));

async function debugToken() {
  if (!appId || !appSecret) {
    return { label: "debug_token", ok: false, error: "Missing app id/app secret for token debugging." };
  }

  try {
    const url = new URL("https://graph.facebook.com/debug_token");
    url.searchParams.set("input_token", accessToken);
    url.searchParams.set("access_token", `${appId}|${appSecret}`);
    const res = await fetch(url);
    const data = await res.json();
    if (!res.ok) throw new Error(data?.error?.message || res.statusText);
    return {
      label: "debug_token",
      ok: true,
      data: {
        app_id: data.data?.app_id,
        type: data.data?.type,
        application: data.data?.application,
        expires_at: data.data?.expires_at,
        is_valid: data.data?.is_valid,
        scopes: data.data?.scopes || [],
        granular_scopes: data.data?.granular_scopes || [],
      },
    };
  } catch (error) {
    return { label: "debug_token", ok: false, error: error.message };
  }
}

function summarize(results) {
  const byLabel = Object.fromEntries(results.map((result) => [result.label, result]));
  const tokenScopes = byLabel.debug_token?.data?.scopes || [];
  const businessReadable = Boolean(byLabel.business?.ok);
  const catalogReadable = Boolean(byLabel.catalog?.ok || byLabel.owned_product_catalogs?.ok);
  const ownedAdCount = byLabel.owned_ad_accounts?.data?.data?.length || 0;
  const clientAdCount = byLabel.client_ad_accounts?.data?.data?.length || 0;
  const adsReadable = Boolean((byLabel.owned_ad_accounts?.ok && ownedAdCount > 0) || (byLabel.client_ad_accounts?.ok && clientAdCount > 0));
  const pagesReadable = Boolean(byLabel.owned_pages?.ok);
  const failed = results.filter((result) => !result.ok).map((result) => ({ label: result.label, error: result.error }));

  return {
    token_scopes: tokenScopes,
    business_readable: businessReadable,
    pages_readable: pagesReadable,
    ads_readable: adsReadable,
    ad_accounts_visible: ownedAdCount + clientAdCount,
    catalog_readable: catalogReadable,
    failed_checks: failed,
    likely_next_permissions: inferMissingPermissions({ businessReadable, pagesReadable, adsReadable, catalogReadable, tokenScopes }),
  };
}

function inferMissingPermissions({ businessReadable, pagesReadable, adsReadable, catalogReadable, tokenScopes }) {
  const permissions = new Set();
  if (!businessReadable || !tokenScopes.includes("business_management")) permissions.add("business_management");
  if (!pagesReadable) {
    permissions.add("pages_show_list");
    permissions.add("pages_read_engagement");
    permissions.add("instagram_basic");
  }
  if (!adsReadable) {
    permissions.add("ads_read");
    permissions.add("business_management");
  }
  if (!catalogReadable) {
    permissions.add("catalog_management");
    permissions.add("business_management");
  }
  return [...permissions];
}
