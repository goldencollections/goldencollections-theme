import fs from "fs";
import path from "path";
import { assertExpectedYouTubeChannel, getAccessToken, readEnv, root } from "./youtube-lib.mjs";

const env = readEnv();
const videoPath = process.argv[2] || env.YOUTUBE_UPLOAD_VIDEO_PATH;
const outputPath = path.join(root, "tmp", "youtube-upload-result.json");

if (!videoPath) {
  throw new Error("Provide a video path as the first argument or set YOUTUBE_UPLOAD_VIDEO_PATH in env");
}

const resolvedVideoPath = path.resolve(root, videoPath);
if (!fs.existsSync(resolvedVideoPath)) {
  throw new Error(`Video file not found: ${resolvedVideoPath}`);
}

const title = env.YOUTUBE_UPLOAD_TITLE || "Golden Collections Video";
const description = env.YOUTUBE_UPLOAD_DESCRIPTION || "Golden Collections educational video.";
const tags = (env.YOUTUBE_UPLOAD_TAGS || "Golden Collections,jewellery,Indian jewellery").split(",").map((tag) => tag.trim()).filter(Boolean);
const categoryId = env.YOUTUBE_UPLOAD_CATEGORY_ID || "26";
const privacyStatus = env.YOUTUBE_UPLOAD_PRIVACY_STATUS || "private";

const metadata = {
  snippet: {
    title,
    description,
    tags,
    categoryId,
  },
  status: {
    privacyStatus,
    selfDeclaredMadeForKids: false,
  },
};

const matchedChannel = await assertExpectedYouTubeChannel();
const boundary = `gc_youtube_${Date.now().toString(16)}`;
const video = fs.readFileSync(resolvedVideoPath);
const body = Buffer.concat([
  Buffer.from(`--${boundary}\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n${JSON.stringify(metadata)}\r\n`),
  Buffer.from(`--${boundary}\r\nContent-Type: video/mp4\r\n\r\n`),
  video,
  Buffer.from(`\r\n--${boundary}--\r\n`),
]);

const accessToken = await getAccessToken();
const url = "https://www.googleapis.com/upload/youtube/v3/videos?uploadType=multipart&part=snippet,status";
const res = await fetch(url, {
  method: "POST",
  headers: {
    Authorization: `Bearer ${accessToken}`,
    "Content-Type": `multipart/related; boundary=${boundary}`,
    "Content-Length": String(body.length),
  },
  body,
});

const text = await res.text();
let json = null;
if (text) {
  try {
    json = JSON.parse(text);
  } catch {
    json = text;
  }
}

if (!res.ok) {
  throw new Error(`YouTube upload failed HTTP ${res.status}: ${text}`);
}

const result = {
  created_at: new Date().toISOString(),
  videoPath: resolvedVideoPath,
  matchedChannel: {
    id: matchedChannel.id,
    title: matchedChannel.snippet?.title,
    customUrl: matchedChannel.snippet?.customUrl,
  },
  metadata,
  response: json,
};

fs.mkdirSync(path.dirname(outputPath), { recursive: true });
fs.writeFileSync(outputPath, JSON.stringify(result, null, 2));

console.log(
  JSON.stringify(
    {
      id: json.id,
      url: json.id ? `https://www.youtube.com/watch?v=${json.id}` : null,
      privacyStatus,
      outputPath,
    },
    null,
    2,
  ),
);
