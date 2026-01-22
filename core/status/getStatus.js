import os from "os";
import path from "path";
import { loadState } from "../state.js";

// Safe root for future file ops (keep it opinionated + safe)
function defaultSafeRoot() {
  return path.join(os.homedir(), "Examen");
}

function fmtUptime(ms) {
  const s = Math.floor(ms / 1000);
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const ss = s % 60;

  if (h > 0) return `${h}h ${m}m`;
  if (m > 0) return `${m}m ${ss}s`;
  return `${ss}s`;
}

function nowClock() {
  const d = new Date();
  const hh = String(d.getHours()).padStart(2, "0");
  const mm = String(d.getMinutes()).padStart(2, "0");
  return `${hh}:${mm}`;
}

/**
 * Status is a small facts object.
 * Later: files module can reuse cwd + safeRoot + mode.
 */
export async function getStatus(ctx = {}) {
  const state = ctx.state || loadState();

  const bootAt = state.last_boot ? Date.parse(state.last_boot) : Date.now();
  const uptimeMs = Math.max(0, Date.now() - bootAt);

  const cwd = state.cwd || process.cwd();
  const mode = state.mode || "safe"; // safe | full (future)

  const safeRoot = state.safe_root || defaultSafeRoot();

  // Optional module signals (non-fatal)
  const signals = {
    feedsUnread: null,
    spotify: null,
  };

  // If modules expose status hooks, read them safely
  // ctx.sensors can be built in loadCommands() later
  if (ctx?.sensors?.feedsUnread) {
    try {
      signals.feedsUnread = await ctx.sensors.feedsUnread();
    } catch {
      signals.feedsUnread = null;
    }
  }

  if (ctx?.sensors?.spotifyLinked) {
    try {
      signals.spotify = (await ctx.sensors.spotifyLinked()) ? "linked" : "none";
    } catch {
      signals.spotify = null;
    }
  }

  return {
    time: nowClock(),
    uptime: fmtUptime(uptimeMs),
    cwd,
    mode,
    safeRoot,
    feedsUnread: signals.feedsUnread,
    spotify: signals.spotify,
  };
}
