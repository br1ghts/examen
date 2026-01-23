import fs from "fs";
import os from "os";
import path from "path";

const JOURNAL_DIR = path.join(os.homedir(), ".examen", "journal");
const JOURNAL_FILE = path.join(JOURNAL_DIR, "entries.ndjson");

function ensureDir() {
  if (!fs.existsSync(JOURNAL_DIR)) fs.mkdirSync(JOURNAL_DIR, { recursive: true });
}

export function appendEntry(entry) {
  ensureDir();
  fs.appendFileSync(JOURNAL_FILE, JSON.stringify(entry) + "\n", "utf8");
  return JOURNAL_FILE;
}

export function readEntries() {
  ensureDir();
  if (!fs.existsSync(JOURNAL_FILE)) return [];

  const raw = fs.readFileSync(JOURNAL_FILE, "utf8").trim();
  if (!raw) return [];

  return raw
    .split("\n")
    .map((line) => {
      try { return JSON.parse(line); } catch { return null; }
    })
    .filter(Boolean);
}

export function getJournalPaths() {
  return { JOURNAL_DIR, JOURNAL_FILE };
}
export function getLogPaths() {
  ensureDir();
  return { LOG_FILE, DATA_DIR };
}
