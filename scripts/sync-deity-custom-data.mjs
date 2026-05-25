#!/usr/bin/env node
import fs from "node:fs";

const APPLY = process.argv.includes("--apply");
const ENV_FILE = getArg("--env") || "env";
const METAOBJECT_FILE = getArg("--metaobjects") || "custom-data/metaobject-definitions.json";
const METAFIELD_FILE = getArg("--metafields") || "custom-data/product-metafield-definitions.json";

const env = readEnv(ENV_FILE);
const SHOP = env.SHOPIFY_STORE_DOMAIN;
const TOKEN = env.SHOPIFY_ADMIN_TOKEN;
const API_VERSION = env.SHOPIFY_API_VERSION || "2025-10";
const ENDPOINT = `https://${SHOP}/admin/api/${API_VERSION}/graphql.json`;

if (!SHOP || !TOKEN) {
  console.error("Missing SHOPIFY_STORE_DOMAIN or SHOPIFY_ADMIN_TOKEN");
  process.exit(1);
}

const desiredMetaobjects = JSON.parse(fs.readFileSync(METAOBJECT_FILE, "utf8")).map((row) => row.definition);
const desiredMetafields = JSON.parse(fs.readFileSync(METAFIELD_FILE, "utf8")).map((row) => row.definition);

const referenceTargetByKey = {
  category_node_ref: "category_node",
  compatible_deity_refs: "deity_group",
  crown_size_standard_ref: "deity_crown_size_standard",
  default_ornament_types: "deity_ornament_type",
  deity_group_refs: "deity_group",
  deity_groups: "deity_group",
  featured_collections: null,
  not_for_deity_refs: "deity_group",
  ornament_type: "deity_ornament_type",
  ornament_type_ref: "deity_ornament_type",
  ornament_type_refs: "deity_ornament_type",
  parent_group_ref: "deity_group",
  primary_deity_ref: "deity_group",
  related_collection_refs: null,
  shop_by_deity_collection: null,
  size_profile_ref: "deity_size_profile",
  subcollections: null
};

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
        return [line.slice(0, index), line.slice(index + 1)];
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

function metaobjectFieldInput(field, definitionIds) {
  const input = {
    key: field.key,
    name: field.name,
    type: field.type
  };
  if (field.required !== undefined) input.required = field.required;

  const targetType = referenceTargetByKey[field.key];
  if (field.type.includes("metaobject_reference") && targetType && definitionIds.has(targetType)) {
    input.validations = [{ name: "metaobject_definition_id", value: definitionIds.get(targetType) }];
  }

  return input;
}

function metafieldInput(def, definitionIds) {
  const input = {
    namespace: def.namespace,
    key: def.key,
    name: def.name,
    ownerType: def.ownerType,
    type: def.type,
    description: def.description
  };

  const targetType = referenceTargetByKey[def.key];
  if (def.type.includes("metaobject_reference") && targetType && definitionIds.has(targetType)) {
    input.validations = [{ name: "metaobject_definition_id", value: definitionIds.get(targetType) }];
  }

  return input;
}

async function getMetaobjectDefinitions() {
  const query = `
    query MetaobjectDefinitions($after: String) {
      metaobjectDefinitions(first: 250, after: $after) {
        nodes {
          id
          type
          name
          fieldDefinitions {
            key
            name
            type { name }
          }
        }
        pageInfo { hasNextPage endCursor }
      }
    }
  `;

  const nodes = [];
  let after = null;
  while (true) {
    const data = await gql(query, { after });
    nodes.push(...data.metaobjectDefinitions.nodes);
    if (!data.metaobjectDefinitions.pageInfo.hasNextPage) break;
    after = data.metaobjectDefinitions.pageInfo.endCursor;
  }
  return nodes;
}

async function getMetafieldDefinitions(ownerType) {
  const query = `
    query MetafieldDefinitions($ownerType: MetafieldOwnerType!, $after: String) {
      metafieldDefinitions(first: 250, ownerType: $ownerType, namespace: "custom", after: $after) {
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
    const data = await gql(query, { ownerType, after });
    nodes.push(...data.metafieldDefinitions.nodes);
    if (!data.metafieldDefinitions.pageInfo.hasNextPage) break;
    after = data.metafieldDefinitions.pageInfo.endCursor;
  }
  return nodes;
}

async function createMetaobjectDefinition(def, definitionIds) {
  const mutation = `
    mutation CreateMetaobjectDefinition($definition: MetaobjectDefinitionCreateInput!) {
      metaobjectDefinitionCreate(definition: $definition) {
        metaobjectDefinition { id type name }
        userErrors { field message code }
      }
    }
  `;
  const input = {
    type: def.type,
    name: def.name,
    description: def.description,
    access: def.access,
    displayNameKey: def.displayNameKey,
    fieldDefinitions: def.fieldDefinitions.map((field) => metaobjectFieldInput(field, definitionIds))
  };
  const data = await gql(mutation, { definition: input });
  const errors = data.metaobjectDefinitionCreate.userErrors || [];
  if (errors.length) throw new Error(`Create ${def.type}: ${JSON.stringify(errors)}`);
  return data.metaobjectDefinitionCreate.metaobjectDefinition;
}

async function updateMetaobjectDefinition(existing, def, missingFields, definitionIds) {
  const mutation = `
    mutation UpdateMetaobjectDefinition($id: ID!, $definition: MetaobjectDefinitionUpdateInput!) {
      metaobjectDefinitionUpdate(id: $id, definition: $definition) {
        metaobjectDefinition { id type name }
        userErrors { field message code }
      }
    }
  `;
  const input = {
    name: def.name,
    description: def.description,
    access: def.access,
    displayNameKey: def.displayNameKey,
    fieldDefinitions: missingFields.map((field) => ({
      create: metaobjectFieldInput(field, definitionIds)
    }))
  };
  const data = await gql(mutation, { id: existing.id, definition: input });
  const errors = data.metaobjectDefinitionUpdate.userErrors || [];
  if (errors.length) throw new Error(`Update ${def.type}: ${JSON.stringify(errors)}`);
  return data.metaobjectDefinitionUpdate.metaobjectDefinition;
}

async function createMetafieldDefinition(def, definitionIds) {
  const mutation = `
    mutation CreateMetafieldDefinition($definition: MetafieldDefinitionInput!) {
      metafieldDefinitionCreate(definition: $definition) {
        createdDefinition { id namespace key ownerType }
        userErrors { field message code }
      }
    }
  `;
  const data = await gql(mutation, { definition: metafieldInput(def, definitionIds) });
  const errors = data.metafieldDefinitionCreate.userErrors || [];
  if (errors.length) throw new Error(`Create ${def.ownerType}.${def.key}: ${JSON.stringify(errors)}`);
  return data.metafieldDefinitionCreate.createdDefinition;
}

async function updateMetafieldDefinition(def, definitionIds) {
  const mutation = `
    mutation UpdateMetafieldDefinition($definition: MetafieldDefinitionUpdateInput!) {
      metafieldDefinitionUpdate(definition: $definition) {
        updatedDefinition { id namespace key ownerType }
        userErrors { field message code }
      }
    }
  `;
  const input = metafieldInput(def, definitionIds);
  delete input.type;
  const data = await gql(mutation, { definition: input });
  const errors = data.metafieldDefinitionUpdate.userErrors || [];
  if (errors.length) throw new Error(`Update ${def.ownerType}.${def.key}: ${JSON.stringify(errors)}`);
  return data.metafieldDefinitionUpdate.updatedDefinition;
}

async function main() {
  console.log(APPLY ? "MODE: APPLY" : "MODE: DRY-RUN");

  let metaobjectDefinitions = await getMetaobjectDefinitions();
  let metaobjectByType = new Map(metaobjectDefinitions.map((definition) => [definition.type, definition]));
  let definitionIds = new Map(metaobjectDefinitions.map((definition) => [definition.type, definition.id]));

  for (const def of desiredMetaobjects) {
    const existing = metaobjectByType.get(def.type);
    if (!existing) {
      console.log(`[METAOBJECT CREATE] ${def.type}`);
      if (APPLY) {
        const created = await createMetaobjectDefinition(def, definitionIds);
        metaobjectByType.set(created.type, { ...created, fieldDefinitions: [] });
        definitionIds.set(created.type, created.id);
      }
      continue;
    }

    const existingFields = new Set(existing.fieldDefinitions.map((field) => field.key));
    const missingFields = def.fieldDefinitions.filter((field) => !existingFields.has(field.key));
    if (missingFields.length === 0) {
      console.log(`[METAOBJECT OK] ${def.type}`);
      continue;
    }

    console.log(`[METAOBJECT UPDATE] ${def.type} add=${missingFields.map((field) => field.key).join(",")}`);
    if (APPLY) await updateMetaobjectDefinition(existing, def, missingFields, definitionIds);
  }

  metaobjectDefinitions = await getMetaobjectDefinitions();
  definitionIds = new Map(metaobjectDefinitions.map((definition) => [definition.type, definition.id]));

  for (const ownerType of ["PRODUCT", "COLLECTION"]) {
    const existingMetafields = await getMetafieldDefinitions(ownerType);
    const existingByKey = new Map(existingMetafields.map((definition) => [definition.key, definition]));
    const desiredForOwner = desiredMetafields.filter((def) => def.ownerType === ownerType);

    for (const def of desiredForOwner) {
      const existing = existingByKey.get(def.key);
      if (!existing) {
        console.log(`[METAFIELD CREATE] ${ownerType}.${def.key}`);
        if (APPLY) await createMetafieldDefinition(def, definitionIds);
        continue;
      }

      console.log(`[METAFIELD UPDATE] ${ownerType}.${def.key}`);
      if (APPLY) await updateMetafieldDefinition(def, definitionIds);
    }
  }
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
