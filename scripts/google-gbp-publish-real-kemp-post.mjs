import fs from "fs";
import path from "path";
import { googleApi, readEnv, root } from "./google-gbp-lib.mjs";

const env = readEnv();
const accountId = env.GOOGLE_GBP_ACCOUNT_ID;
const locationId = env.GOOGLE_GBP_LOCATION_ID;
const outputPath = path.join(root, "tmp", "google-gbp-real-kemp-post-result.json");

if (!accountId || !locationId) {
  throw new Error("Missing GOOGLE_GBP_ACCOUNT_ID or GOOGLE_GBP_LOCATION_ID in env. Run list script first and choose the correct location.");
}

const articleUrl = "https://www.goldencollections.com/blogs/jewellery-guides/real-kemp-jewellery-guide";
const imageUrl = "https://cdn.shopify.com/s/files/1/0764/9224/3242/articles/gc-real-kemp-arangetram-set-bks001-2026.jpg?v=1778696580";

const payload = {
  languageCode: "en",
  summary:
    "New Golden Collections guide: learn what real kemp jewellery means, how materials differ, and how to choose the right set for Bharatanatyam, Kuchipudi, festive use, or gifting.",
  callToAction: {
    actionType: "LEARN_MORE",
    url: articleUrl,
  },
  media: [
    {
      mediaFormat: "PHOTO",
      sourceUrl: imageUrl,
    },
  ],
  topicType: "STANDARD",
};

const url = `https://mybusiness.googleapis.com/v4/accounts/${accountId}/locations/${locationId}/localPosts`;
const post = await googleApi(url, {
  method: "POST",
  body: JSON.stringify(payload),
});

const result = {
  created_at: new Date().toISOString(),
  accountId,
  locationId,
  payload,
  post,
};

fs.mkdirSync(path.dirname(outputPath), { recursive: true });
fs.writeFileSync(outputPath, JSON.stringify(result, null, 2));
console.log(JSON.stringify({ name: post.name, searchUrl: post.searchUrl || null, outputPath }, null, 2));
