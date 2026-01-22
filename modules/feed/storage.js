import fs from "fs";
import os from "os";
import path from "path";

const FEED_DIR = path.join(os.homedir(), ".examen", "feed");
const FEEDS_FILE = path.join(FEED_DIR, "feeds.json");
const ITEMS_FILE = path.join(FEED_DIR, "items.json");

function ensureDir() {
  if (!fs.existsSync(FEED_DIR)) fs.mkdirSync(FEED_DIR, { recursive: true });
}

function readJson(file, fallback) {
  ensureDir();
  if (!fs.existsSync(file)) {
    fs.writeFileSync(file, JSON.stringify(fallback, null, 2), "utf8");
    return fallback;
  }
  try {
    const raw = fs.readFileSync(file, "utf8");
    return JSON.parse(raw);
  } catch {
    fs.writeFileSync(file, JSON.stringify(fallback, null, 2), "utf8");
    return fallback;
  }
}

function writeJson(file, data) {
  ensureDir();
  fs.writeFileSync(file, JSON.stringify(data, null, 2), "utf8");
}

export function loadFeeds() {
  return readJson(FEEDS_FILE, { feeds: [] });
}
export function saveFeeds(data) {
  writeJson(FEEDS_FILE, data);
}

export function loadItems() {
  return readJson(ITEMS_FILE, { items: [] });
}
export function saveItems(data) {
  writeJson(ITEMS_FILE, data);
}

export function getFeedPaths() {
  return { FEED_DIR, FEEDS_FILE, ITEMS_FILE };
}
