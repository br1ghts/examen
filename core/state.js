import fs from "fs";
import os from "os";
import path from "path";

const EXAMEN_DIR = path.join(os.homedir(), ".examen");
const STATE_FILE = path.join(EXAMEN_DIR, "state.json");

function ensureDir() {
  if (!fs.existsSync(EXAMEN_DIR)) fs.mkdirSync(EXAMEN_DIR, { recursive: true });
}

export function loadState() {
  ensureDir();

  if (!fs.existsSync(STATE_FILE)) {
    const initial = {
      created_at: new Date().toISOString(),
      last_boot: null,
      boots: 0,
      user: process.env.USER || process.env.USERNAME || "unknown"
    };
    fs.writeFileSync(STATE_FILE, JSON.stringify(initial, null, 2), "utf8");
    return initial;
  }

  try {
    const raw = fs.readFileSync(STATE_FILE, "utf8");
    return JSON.parse(raw);
  } catch {
    // If the file gets corrupted, fail safe.
    const fallback = {
      created_at: new Date().toISOString(),
      last_boot: null,
      boots: 0,
      user: process.env.USER || process.env.USERNAME || "unknown"
    };
    fs.writeFileSync(STATE_FILE, JSON.stringify(fallback, null, 2), "utf8");
    return fallback;
  }
}

export function saveState(state) {
  ensureDir();
  fs.writeFileSync(STATE_FILE, JSON.stringify(state, null, 2), "utf8");
}

export function getPaths() {
  return { EXAMEN_DIR, STATE_FILE };
}
