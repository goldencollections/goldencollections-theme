import fs from "fs";
import path from "path";
import { assertExpectedYouTubeChannel, expectedYouTubeChannel, getMyYouTubeChannels, root } from "./youtube-lib.mjs";

const outputPath = path.join(root, "tmp", "youtube-channel.json");

const channels = await getMyYouTubeChannels();
const expected = expectedYouTubeChannel();
const matched = await assertExpectedYouTubeChannel();
const result = { expected, matchedChannelId: matched.id, items: channels };

fs.mkdirSync(path.dirname(outputPath), { recursive: true });
fs.writeFileSync(outputPath, JSON.stringify(result, null, 2));

console.log(
  JSON.stringify(
    {
      expected,
      matched: {
        id: matched.id,
        title: matched.snippet?.title,
        customUrl: matched.snippet?.customUrl,
      },
      channels: channels.map((channel) => ({
        id: channel.id,
        title: channel.snippet?.title,
        customUrl: channel.snippet?.customUrl,
        subscribers: channel.statistics?.subscriberCount,
        videos: channel.statistics?.videoCount,
      })),
    },
    null,
    2,
  ),
);
