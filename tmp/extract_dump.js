const fs = require("fs");
const { spawn } = require("child_process");
const readline = require("readline");

function decodeXvideosTitle(str) {
  if (!str) return "";
  let cleaned = str
    .replace(/&amp_?/gi, "&")
    .replace(/&quot_?/gi, '"')
    .replace(/&#039_?/gi, "'")
    .replace(/&apos_?/gi, "'")
    .replace(/&lt_?/gi, "<")
    .replace(/&gt_?/gi, ">")
    .replace(/&ndash_?/gi, "–")
    .replace(/&mdash_?/gi, "—")
    .replace(/&hellip_?/gi, "...")
    .replace(/&nbsp_?/gi, " ")
    .replace(/&auml_?/gi, "ä")
    .replace(/&euml_?/gi, "ë")
    .replace(/&iuml_?/gi, "ï")
    .replace(/&ouml_?/gi, "ö")
    .replace(/&uuml_?/gi, "ü")
    .replace(/&#\d+;?/g, (m) => {
      const code = parseInt(m.replace(/\D/g, ""), 10);
      return isNaN(code) ? "" : String.fromCharCode(code);
    })
    .replace(/\s+/g, " ")
    .trim();

  if (cleaned.includes("_") && !cleaned.includes(" ")) {
    cleaned = cleaned.replace(/_/g, " ");
  }
  if (cleaned.length > 0) {
    cleaned = cleaned.charAt(0).toUpperCase() + cleaned.slice(1);
  }
  return cleaned;
}

function formatDurationFromSec(secStr) {
  if (!secStr) return "10:00";
  const numMatch = secStr.match(/(\d+)/);
  if (!numMatch) return "10:00";
  const totalSec = parseInt(numMatch[1], 10);
  if (isNaN(totalSec) || totalSec <= 0) return "10:00";

  const hours = Math.floor(totalSec / 3600);
  const minutes = Math.floor((totalSec % 3600) / 60);
  const seconds = totalSec % 60;
  const pad = (n) => (n < 10 ? `0${n}` : `${n}`);

  if (hours > 0) {
    return `${hours}:${pad(minutes)}:${pad(seconds)}`;
  }
  return `${pad(minutes)}:${pad(seconds)}`;
}

async function extractDump() {
  const child = spawn("unzip", ["-p", "/tmp/week_export.zip"]);
  const rl = readline.createInterface({ input: child.stdout, crlfDelay: Infinity });

  const list = [];
  for await (const line of rl) {
    if (!line.trim()) continue;
    const parts = line.split(";");
    if (parts.length >= 6) {
      const videoUrl = parts[0]?.trim() || "";
      const rawTitle = parts[1]?.trim() || "";
      const durationStr = parts[2]?.trim() || "";
      const thumbUrl = parts[3]?.trim() || "";
      const embedCode = parts[4]?.trim() || "";
      const tagsStr = parts[5]?.trim() || "";
      const channelStr = parts[6]?.trim() || "";
      const catStr = parts[8]?.trim() || "General";

      const match = (embedCode || videoUrl).match(/embedframe\/([a-zA-Z0-9_-]+)/i) || videoUrl.match(/video\.?([a-zA-Z0-9_-]+)/i);
      const extId = match?.[1] || "";

      if (extId && rawTitle && !rawTitle.includes("deleted") && thumbUrl) {
        list.push({
          extId,
          title: decodeXvideosTitle(rawTitle),
          thumbUrl,
          embedUrl: `https://www.xvideos.com/embedframe/${extId}`,
          duration: formatDurationFromSec(durationStr),
          tags: tagsStr ? tagsStr.split(",").map(t => t.trim().toLowerCase()).filter(Boolean) : ["hd"],
          channel: channelStr || "XVideos Network",
          category: catStr,
        });
      }
    }
    if (list.length >= 2500) break;
  }
  child.kill();

  fs.writeFileSync("./src/lib/realXVideosDump.json", JSON.stringify(list, null, 2));
  console.log(`Saved ${list.length} real XVideos dump items to ./src/lib/realXVideosDump.json!`);
}

extractDump();
