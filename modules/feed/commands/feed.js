import { spawn } from "child_process";
import crypto from "crypto";
import { loadFeeds, saveFeeds, loadItems, saveItems, getFeedPaths } from "../storage.js";
import { parseFeedXml } from "../parse.js";
import {table, cell, section, hint } from "../../../core/ui/index.js";

function usage() {
  console.log("\nusage:");
  console.log("  feed add <url> [name...]");
  console.log("  feed ls");
  console.log("  feed rm <id>");
  console.log("  feed check");
  console.log("  feed new");
  console.log("  feed all");
  console.log("  feed read <itemId>");
  console.log("  feed clear");
  console.log("  feed open <itemId>");
  console.log("  feed edit\n");
}

function shortId() {
  return crypto.randomBytes(4).toString("hex");
}

function openUrl(url) {
  const cmd =
    process.platform === "darwin" ? "open" :
    process.platform === "win32" ? "start" :
    "xdg-open";

  spawn(cmd, [url], { stdio: "ignore", shell: process.platform === "win32" });
}

function openFile(filePath) {
  // fallback if $EDITOR broken
  const cmd =
    process.platform === "darwin" ? "open" :
    process.platform === "win32" ? "start" :
    "xdg-open";

  spawn(cmd, [filePath], { stdio: "ignore", shell: process.platform === "win32" });
}

function fmtDate(iso) {
  if (!iso) return "";
  try {
    const d = new Date(iso);
    return d.toLocaleString();
  } catch {
    return iso;
  }
}

function getFeedName(feeds, id) {
  return feeds.find(f => f.id === id)?.name || id;
}

function printItems(items, feeds) {
  if (!items.length) {
    console.log("\n(nothing)\n");
    return;
  }

  console.log(section("signal"));

  const rows = items.map(it => {
    const st = it.read ? cell.dim(" ") : cell.unread("*");
    const src = cell.dim(getFeedName(feeds, it.feed));
    const title = cell.text(it.title);
    const time = cell.dim(it.date ? fmtDate(it.date) : "");
    const id = cell.dim(it.id);
    return [st, id, src, title, time];
  });

  console.log(
    table(["st", "id", "source", "title", "time"], rows, {
      colWidths: [4, 14, 16, 52, 20]
    })
  );

  console.log(hint("feed open <id>  |  feed read <id>  |  feed check"));
  console.log("");
}

export default {
  name: "feed",
  desc: "rss/atom inbox: add/ls/rm/check/new/open/read",
  async run(args) {
    const sub = (args[0] || "").toLowerCase();
    if (!sub || sub === "help") return usage();

    // ----- FEEDS -----
    if (sub === "add") {
      const url = (args[1] || "").trim();
      const name = args.slice(2).join(" ").trim() || null;

      if (!url) return usage();

      const data = loadFeeds();
      data.feeds ||= [];

      if (data.feeds.some(f => f.url === url)) {
        console.log("\n(feed already added)\n");
        return;
      }

      const id = (name ? name.toLowerCase().replace(/[^a-z0-9_-]+/g, "-") : "") || shortId();
      data.feeds.push({ id, name: name || id, url });

      saveFeeds(data);
      console.log(`\nadded feed '${id}'.\n`);
      return;
    }

    if (sub === "ls") {
      const data = loadFeeds();
      if (!data.feeds?.length) {
        console.log("\n(no feeds yet)\n");
        console.log("add one with:\n  feed add <url> [name]\n");
        return;
      }

      console.log("\nfeeds");
      for (const f of data.feeds) {
        console.log(`  ${f.id}  ${f.name} -> ${f.url}`);
      }
      console.log("");
      return;
    }

    if (sub === "rm") {
      const id = (args[1] || "").trim();
      if (!id) return usage();

      const feedsData = loadFeeds();
      const before = feedsData.feeds?.length || 0;
      feedsData.feeds = (feedsData.feeds || []).filter(f => f.id !== id);

      if ((feedsData.feeds?.length || 0) === before) {
        console.log(`\nno such feed: ${id}\n`);
        return;
      }

      saveFeeds(feedsData);
      console.log(`\nremoved feed '${id}'.\n`);
      return;
    }

    if (sub === "edit") {
      const { FEEDS_FILE } = getFeedPaths();
      openFile(FEEDS_FILE);
      console.log(`\nopened: ${FEEDS_FILE}\n`);
      return;
    }

    // ----- ITEMS -----
    if (sub === "check") {
      const feedsData = loadFeeds();
      const feeds = feedsData.feeds || [];
      if (!feeds.length) {
        console.log("\n(no feeds to check)\n");
        return;
      }

      const itemsData = loadItems();
      itemsData.items ||= [];

      const existing = new Set(itemsData.items.map(i => i.id));
      let added = 0;
      let failed = 0;

      for (const f of feeds) {
        try {
          const res = await fetch(f.url, {
            headers: { "User-Agent": "examen-feed/0.1" }
          });
          if (!res.ok) throw new Error(`HTTP ${res.status}`);

          const xml = await res.text();
          const parsed = parseFeedXml(f.id, xml);

          for (const it of parsed) {
            if (existing.has(it.id)) continue;
            existing.add(it.id);
            itemsData.items.push(it);
            added++;
          }

          console.log(`checked ${f.id}: +${parsed.length}`);
        } catch (e) {
          failed++;
          console.log(`checked ${f.id}: failed (${e.message})`);
        }
      }

      // keep items trimmed (latest 2000)
      itemsData.items.sort((a, b) => (b.date || "").localeCompare(a.date || ""));
      if (itemsData.items.length > 2000) itemsData.items = itemsData.items.slice(0, 2000);

      saveItems(itemsData);
      console.log(`\ncheck complete: added ${added}, failed ${failed}\n`);
      return;
    }

    if (sub === "new") {
      const feedsData = loadFeeds();
      const itemsData = loadItems();

      const unread = (itemsData.items || [])
        .filter(i => !i.read)
        .sort((a, b) => (b.date || "").localeCompare(a.date || ""))
        .slice(0, 50);

      printItems(unread, feedsData.feeds || []);
      return;
    }

    if (sub === "all") {
      const feedsData = loadFeeds();
      const itemsData = loadItems();

      const recent = (itemsData.items || [])
        .sort((a, b) => (b.date || "").localeCompare(a.date || ""))
        .slice(0, 50);

      printItems(recent, feedsData.feeds || []);
      return;
    }

    if (sub === "read") {
      const itemId = (args[1] || "").trim();
      if (!itemId) return usage();

      const itemsData = loadItems();
      const it = (itemsData.items || []).find(i => i.id === itemId);
      if (!it) {
        console.log(`\nno such item: ${itemId}\n`);
        return;
      }

      it.read = true;
      saveItems(itemsData);
      console.log(`\nmarked read: ${itemId}\n`);
      return;
    }

    if (sub === "clear") {
      const itemsData = loadItems();
      for (const it of itemsData.items || []) it.read = true;
      saveItems(itemsData);
      console.log("\nall items marked read.\n");
      return;
    }

    if (sub === "open") {
      const itemId = (args[1] || "").trim();
      if (!itemId) return usage();

      const itemsData = loadItems();
      const it = (itemsData.items || []).find(i => i.id === itemId);
      if (!it?.link) {
        console.log(`\nno link for item: ${itemId}\n`);
        return;
      }

      it.read = true;
      saveItems(itemsData);

      console.log(`\nopening: ${it.link}\n`);
      openUrl(it.link);
      return;
    }

    usage();
  }
};
