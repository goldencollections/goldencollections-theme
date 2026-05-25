#!/usr/bin/env node
import fs from "node:fs";

const APPLY = process.argv.includes("--apply");
const ENV_FILE = getArg("--env") || "env";
const METAFIELD_FILE = getArg("--metafields") || "custom-data/dance-product-metafield-definitions.json";
const env = readEnv(ENV_FILE);
const SHOP = env.SHOPIFY_STORE_DOMAIN;
const TOKEN = env.SHOPIFY_ADMIN_TOKEN;
const API_VERSION = env.SHOPIFY_API_VERSION || "2025-10";
const ENDPOINT = `https://${SHOP}/admin/api/${API_VERSION}/graphql.json`;

if (!SHOP || !TOKEN) {
  console.error("Missing SHOPIFY_STORE_DOMAIN or SHOPIFY_ADMIN_TOKEN");
  process.exit(1);
}

const desiredMetafields = JSON.parse(fs.readFileSync(METAFIELD_FILE, "utf8")).map((row) => row.definition);

function getArg(flag) {
  const i = process.argv.indexOf(flag);
  if (i === -1 || i + 1 >= process.argv.length) return null;
  return process.argv[i + 1];
}

function readEnv(file) {
  return Object.fromEntries(
    fs
      .readFileSync(file, "utf8")
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter((line) => line && !line.startsWith("#"))
      .map((line) => {
        const index = line.indexOf("=");
        return [line.slice(0, index), line.slice(index + 1).replace(/^['"]|['"]$/g, "")];
      })
  );
}

async function gql(query, variables = {}) {
  const res = await fetch(ENDPOINT, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Shopify-Access-Token": TOKEN
    },
    body: JSON.stringify({ query, variables })
  });
  const body = await res.json();
  if (body.errors?.length) throw new Error(`GraphQL errors: ${JSON.stringify(body.errors)}`);
  return body.data;
}

async function getMetafieldDefinitions(ownerType, namespace) {
  const query = `
    query MetafieldDefinitions($ownerType: MetafieldOwnerType!, $namespace: String!, $after: String) {
      metafieldDefinitions(first: 250, ownerType: $ownerType, namespace: $namespace, after: $after) {
        nodes {
          id
          namespace
          key
          name
          ownerType
          type { name }
        }
        pageInfo { hasNextPage endCursor }
      }
    }
  `;

  const nodes = [];
  let after = null;
  while (true) {
    const data = await gql(query, { ownerType, namespace, after });
    nodes.push(...data.metafieldDefinitions.nodes);
    if (!data.metafieldDefinitions.pageInfo.hasNextPage) break;
    after = data.metafieldDefinitions.pageInfo.endCursor;
  }
  return nodes;
}

function metafieldInput(def) {
  return {
    namespace: def.namespace,
    key: def.key,
    name: def.name,
    ownerType: def.ownerType,
    type: def.type,
    description: def.description
  };
}

async function createMetafieldDefinition(def) {
  const mutation = `
    mutation CreateMetafieldDefinition($definition: MetafieldDefinitionInput!) {
      metafieldDefinitionCreate(definition: $definition) {
        createdDefinition { id namespace key ownerType }
        userErrors { field message code }
      }
    }
  `;
  const data = await gql(mutation, { definition: metafieldInput(def) });
  const errors = data.metafieldDefinitionCreate.userErrors || [];
  if (errors.length) throw new Error(`Create ${def.ownerType}.${def.namespace}.${def.key}: ${JSON.stringify(errors)}`);
  return data.metafieldDefinitionCreate.createdDefinition;
}

async function main() {
  console.log(APPLY ? "MODE: APPLY" : "MODE: DRY-RUN");

  const namespaces = [...new Set(desiredMetafields.map((def) => def.namespace))];
  const ownerTypes = [...new Set(desiredMetafields.map((def) => def.ownerType))];

  for (const ownerType of ownerTypes) {
    for (const namespace of namespaces) {
      const desiredForScope = desiredMetafields.filter((def) => def.ownerType === ownerType && def.namespace === namespace);
      if (!desiredForScope.length) continue;

      const existing = await getMetafieldDefinitions(ownerType, namespace);
      const existingByKey = new Map(existing.map((definition) => [definition.key, definition]));

      for (const def of desiredForScope) {
        const current = existingByKey.get(def.key);
        if (!current) {
          console.log(`[METAFIELD CREATE] ${ownerType}.${namespace}.${def.key} (${def.type})`);
          if (APPLY) await createMetafieldDefinition(def);
          continue;
        }

        const currentType = current.type?.name;
        if (currentType !== def.type) {
          console.warn(`[METAFIELD TYPE MISMATCH] ${ownerType}.${namespace}.${def.key}: live=${currentType} desired=${def.type}`);
          continue;
        }

        console.log(`[METAFIELD EXISTS] ${ownerType}.${namespace}.${def.key}`);
      }
    }
  }
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
