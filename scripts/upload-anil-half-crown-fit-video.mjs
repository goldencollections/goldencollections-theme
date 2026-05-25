import fs from "fs";
import path from "path";

const root = process.cwd();
const envText = fs.readFileSync(path.join(root, "env"), "utf8");
const env = Object.fromEntries(
  envText
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line && !line.startsWith("#"))
    .map((line) => {
      const index = line.indexOf("=");
      return [line.slice(0, index), line.slice(index + 1)];
    })
);

const SHOP = env.SHOPIFY_STORE_DOMAIN;
const TOKEN = env.SHOPIFY_ADMIN_TOKEN;
const API_VERSION = env.SHOPIFY_API_VERSION || "2025-10";

const videoPath = path.join(
  root,
  "tmp",
  "anil-half-crown-measurement-video",
  "golden-collections-anil-tunk-half-crown-fit-measurement-captioned.mp4"
);

const alt =
  "Anil Tunk of Golden Collections demonstrating how to measure a deity face and compare half crown size for better crown fit, face visibility and alankaram placement.";

if (!SHOP || !TOKEN) {
  throw new Error("Missing SHOPIFY_STORE_DOMAIN or SHOPIFY_ADMIN_TOKEN in env");
}

async function gql(query, variables = {}) {
  const response = await fetch(`https://${SHOP}/admin/api/${API_VERSION}/graphql.json`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Shopify-Access-Token": TOKEN,
    },
    body: JSON.stringify({ query, variables }),
  });
  const text = await response.text();
  if (!response.ok) throw new Error(`GraphQL HTTP ${response.status}: ${text}`);
  const json = JSON.parse(text);
  if (json.errors) throw new Error(`GraphQL errors: ${JSON.stringify(json.errors)}`);
  return json.data;
}

async function uploadVideo() {
  const stats = fs.statSync(videoPath);
  const filename = path.basename(videoPath);
  const staged = await gql(
    `mutation($input:[StagedUploadInput!]!){
      stagedUploadsCreate(input:$input){
        stagedTargets{ url resourceUrl parameters{ name value } }
        userErrors{ field message }
      }
    }`,
    {
      input: [
        {
          resource: "VIDEO",
          filename,
          mimeType: "video/mp4",
          fileSize: String(stats.size),
          httpMethod: "POST",
        },
      ],
    }
  );
  const stagedErrors = staged.stagedUploadsCreate.userErrors || [];
  if (stagedErrors.length) throw new Error(`stagedUploadsCreate: ${JSON.stringify(stagedErrors)}`);

  const target = staged.stagedUploadsCreate.stagedTargets[0];
  const form = new FormData();
  for (const parameter of target.parameters) form.append(parameter.name, parameter.value);
  form.append("file", new Blob([fs.readFileSync(videoPath)], { type: "video/mp4" }), filename);

  const upload = await fetch(target.url, { method: "POST", body: form });
  const uploadText = await upload.text();
  if (!upload.ok) throw new Error(`Staged upload failed ${upload.status}: ${uploadText}`);

  const created = await gql(
    `mutation($files:[FileCreateInput!]!){
      fileCreate(files:$files){
        files{
          id
          alt
          fileStatus
          ... on Video { preview{ image{ url } } sources{ url mimeType format width height } }
        }
        userErrors{ field message }
      }
    }`,
    {
      files: [
        {
          alt,
          contentType: "VIDEO",
          originalSource: target.resourceUrl,
        },
      ],
    }
  );
  const fileErrors = created.fileCreate.userErrors || [];
  if (fileErrors.length) throw new Error(`fileCreate: ${JSON.stringify(fileErrors)}`);

  const file = created.fileCreate.files[0];
  let videoUrl = file.sources?.find((source) => source.mimeType === "video/mp4")?.url || file.sources?.[0]?.url || null;
  let posterUrl = file.preview?.image?.url || null;
  let status = file.fileStatus;

  for (let attempt = 0; attempt < 24 && (!videoUrl || status !== "READY"); attempt += 1) {
    await new Promise((resolve) => setTimeout(resolve, 2500));
    const data = await gql(
      `query($id:ID!){
        node(id:$id){
          ... on Video {
            id
            fileStatus
            preview{ image{ url } }
            sources{ url mimeType format width height }
          }
        }
      }`,
      { id: file.id }
    );
    status = data.node?.fileStatus;
    videoUrl =
      data.node?.sources?.find((source) => source.mimeType === "video/mp4")?.url ||
      data.node?.sources?.[0]?.url ||
      videoUrl;
    posterUrl = data.node?.preview?.image?.url || posterUrl;
  }

  if (!videoUrl) throw new Error("Uploaded video did not return a URL");

  const result = {
    id: file.id,
    fileStatus: status,
    videoUrl,
    posterUrl,
    alt,
    localPath: videoPath,
  };

  const outputPath = path.join(root, "tmp", "anil-half-crown-measurement-video", "shopify-video-upload.json");
  fs.writeFileSync(outputPath, JSON.stringify(result, null, 2));
  console.log(JSON.stringify(result, null, 2));
}

uploadVideo().catch((error) => {
  console.error(error);
  process.exit(1);
});
