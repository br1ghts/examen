import fs from "fs";
import os from "os";
import path from "path";

const SPOTIFY_DIR = path.join(os.homedir(), ".examen", "spotify");
const CONFIG_FILE = path.join(SPOTIFY_DIR, "config.json");
const TOKEN_FILE = path.join(SPOTIFY_DIR, "token.json");

function ensureDir() {
  if (!fs.existsSync(SPOTIFY_DIR)) fs.mkdirSync(SPOTIFY_DIR, { recursive: true });
}

export function loadConfig() {
  ensureDir();
  if (!fs.existsSync(CONFIG_FILE)) {
    const initial = {
      client_id: "",
      redirect_uri: "http://127.0.0.1:8888/callback"
    };
    fs.writeFileSync(CONFIG_FILE, JSON.stringify(initial, null, 2), "utf8");
    return initial;
  }
  return JSON.parse(fs.readFileSync(CONFIG_FILE, "utf8"));
}

export function saveConfig(cfg) {
  ensureDir();
  fs.writeFileSync(CONFIG_FILE, JSON.stringify(cfg, null, 2), "utf8");
}

export function loadToken() {
  ensureDir();
  if (!fs.existsSync(TOKEN_FILE)) return null;
  try {
    return JSON.parse(fs.readFileSync(TOKEN_FILE, "utf8"));
  } catch {
    return null;
  }
}

export function saveToken(tok) {
  ensureDir();
  fs.writeFileSync(TOKEN_FILE, JSON.stringify(tok, null, 2), "utf8");
}

export function clearToken() {
  ensureDir();
  if (fs.existsSync(TOKEN_FILE)) fs.unlinkSync(TOKEN_FILE);
}

export function getSpotifyPaths() {
  return { SPOTIFY_DIR, CONFIG_FILE, TOKEN_FILE };
}
