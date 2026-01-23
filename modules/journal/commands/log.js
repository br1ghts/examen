import crypto from "crypto";
import { appendEntry, readEntries } from "../storage.js";
import { table, cell, section, hint, panel } from "../../../core/ui/index.js";

function usage() {
  console.log("\nusage:");
  console.log("  log <text>");
  console.log("  log -t tag1,tag2 <text>");
  console.log("  log ls [n]");
  console.log("  log today");
  console.log("  log find <query>");
  console.log("  log view <id>");
  console.log("");
}

function short(id) {
  return (id || "").slice(0, 8);
}

function trunc(s, n = 64) {
  s = String(s || "");
  return s.length > n ? s.slice(0, n - 1) + "…" : s;
}

function fmtLocal(iso) {
  try { return new Date(iso).toLocaleString(); } catch { return iso || ""; }
}

function parseAddArgs(args) {
  let tags = [];
  let textParts = [];

  for (let i = 0; i < args.length; i++) {
    const a = args[i];
    if (a === "-t" || a === "--tag") {
      const raw = args[i + 1];
      if (raw) {
        tags = raw.split(",").map(t => t.trim()).filter(Boolean);
        i++;
      }
    } else {
      textParts.push(a);
    }
  }

  return { text: textParts.join(" ").trim(), tags };
}

function resolveById(entries, idOrPrefix) {
  const key = (idOrPrefix || "").trim();
  if (!key) return null;

  // exact match
  let hit = entries.find(e => e.id === key);
  if (hit) return hit;

  // prefix match
  hit = entries.find(e => (e.id || "").startsWith(key));
  return hit || null;
}

function printList(entries, title = "log", limit = 20) {
  console.log(section(title));

  const rows = entries.slice(0, limit).map(e => {
    const id = cell.dim(short(e.id));
    const time = cell.dim(fmtLocal(e.ts));
    const tags = (e.tags?.length ? e.tags.join(",") : "");
    const tagCell = tags ? cell.warn(trunc(tags, 18)) : cell.dim("-");
    const text = cell.text(trunc(e.text, 70));
    return [id, time, tagCell, text];
  });

  console.log(
    table(["id", "time", "tags", "text"], rows, {
      colWidths: [10, 22, 20, 70],
    })
  );

  console.log(hint("log view <id>  |  log find <q>  |  log today"));
  console.log("");
}

function isSameLocalDay(aISO, bDate = new Date()) {
  const a = new Date(aISO);
  return (
    a.getFullYear() === bDate.getFullYear() &&
    a.getMonth() === bDate.getMonth() &&
    a.getDate() === bDate.getDate()
  );
}

export default {
  name: "log",
  desc: "journal stream: add + view entries",
  run(args) {
    const sub = (args[0] || "").toLowerCase();

    // Viewer commands
    if (sub === "help") return usage();

    if (sub === "ls" || sub === "list") {
      const n = Number(args[1] || 20);
      const entries = readEntries().sort((a, b) => (b.ts || "").localeCompare(a.ts || ""));
      if (!entries.length) {
        console.log("\n(nothing logged yet)\n");
        return;
      }
      return printList(entries, "log", Number.isFinite(n) ? n : 20);
    }

    if (sub === "today") {
      const entries = readEntries()
        .filter(e => e.ts && isSameLocalDay(e.ts))
        .sort((a, b) => (b.ts || "").localeCompare(a.ts || ""));

      if (!entries.length) {
        console.log("\n(nothing logged today)\n");
        return;
      }
      return printList(entries, "today", 50);
    }

    if (sub === "find") {
      const q = args.slice(1).join(" ").trim().toLowerCase();
      if (!q) return usage();

      const entries = readEntries().filter(e => {
        const text = String(e.text || "").toLowerCase();
        const tags = (e.tags || []).join(",").toLowerCase();
        return text.includes(q) || tags.includes(q);
      }).sort((a, b) => (b.ts || "").localeCompare(a.ts || ""));

      if (!entries.length) {
        console.log(`\n(no matches for '${q}')\n`);
        return;
      }
      return printList(entries, `find: ${q}`, 50);
    }

    if (sub === "view") {
      const key = (args[1] || "").trim();
      if (!key) return usage();

      const entries = readEntries().sort((a, b) => (b.ts || "").localeCompare(a.ts || ""));
      const e = resolveById(entries, key);

      if (!e) {
        console.log(`\n(no entry found for '${key}')\n`);
        console.log(hint("try: log ls"));
        console.log("");
        return;
      }

      const tags = e.tags?.length ? e.tags.join(", ") : "-";

      console.log(
        panel("log entry", [
          ["id", e.id || "-"],
          ["time", fmtLocal(e.ts)],
          ["tags", tags],
          ["text", e.text || ""],
        ])
      );
      console.log("");
      return;
    }

    // Default: add entry
    const { text, tags } = parseAddArgs(args);
    if (!text) {
      console.log("usage: log <text>");
      return;
    }

    const entry = {
      id: crypto.randomBytes(6).toString("hex"),
      ts: new Date().toISOString(),
      text,
      tags,
      mood: null,
      source: "cli",
    };

    appendEntry(entry);
    console.log("\nlogged.\n");
  }
};
