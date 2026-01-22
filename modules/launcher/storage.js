import fs from "fs";
import os from "os";
import path from "path";

const LAUNCHER_DIR = path.join(os.homedir(), ".examen", "launcher");
const APPS_FILE = path.join(LAUNCHER_DIR, "apps.json");

function ensureDir() {
  if (!fs.existsSync(LAUNCHER_DIR)) fs.mkdirSync(LAUNCHER_DIR, { recursive: true });
}

export function loadApps() {
  ensureDir();
  if (!fs.existsSync(APPS_FILE)) {
    const initial = { apps: {} };
    fs.writeFileSync(APPS_FILE, JSON.stringify(initial, null, 2), "utf8");
    return initial;
  }

  try {
    const raw = fs.readFileSync(APPS_FILE, "utf8");
    const parsed = JSON.parse(raw);
    if (!parsed.apps || typeof parsed.apps !== "object") parsed.apps = {};
    return parsed;
  } catch {
    // fail-safe: recreate if corrupted
    const fallback = { apps: {} };
    fs.writeFileSync(APPS_FILE, JSON.stringify(fallback, null, 2), "utf8");
    return fallback;
  }
}

export function saveApps(data) {
  ensureDir();
  fs.writeFileSync(APPS_FILE, JSON.stringify(data, null, 2), "utf8");
}

export function getLauncherPaths() {
  return { LAUNCHER_DIR, APPS_FILE };
}
