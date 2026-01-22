import fs from "fs";
import path from "path";
import os from "os";
import { table, section, hint, theme } from "../../../core/ui/index.js";

function expandHome(p) {
  if (!p) return p;
  if (p === "~") return os.homedir();
  if (p.startsWith("~/")) return path.join(os.homedir(), p.slice(2));
  return p;
}

function fmtBytes(n) {
  if (n == null) return "";
  const units = ["B", "KB", "MB", "GB", "TB"];
  let i = 0;
  let v = n;
  while (v >= 1024 && i < units.length - 1) {
    v /= 1024;
    i++;
  }
  const val = i === 0 ? String(Math.round(v)) : v.toFixed(1).replace(/\.0$/, "");
  return `${val}${units[i]}`;
}

function fmtTime(d) {
  const dt = new Date(d);
  const yyyy = dt.getFullYear();
  const mm = String(dt.getMonth() + 1).padStart(2, "0");
  const dd = String(dt.getDate()).padStart(2, "0");
  const hh = String(dt.getHours()).padStart(2, "0");
  const mi = String(dt.getMinutes()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd} ${hh}:${mi}`;
}

function parseArgs(args) {
  const out = {
    all: false,
    long: false,
    sort: "name", // name | time | size
    target: null,
  };

  for (let i = 0; i < args.length; i++) {
    const a = args[i];

    if (a === "-a" || a === "--all") out.all = true;
    else if (a === "-l" || a === "--long") out.long = true;
    else if (a === "--sort") {
      const v = (args[i + 1] || "").toLowerCase();
      if (["name", "time", "size"].includes(v)) out.sort = v;
      i++;
    } else if (!a.startsWith("-") && !out.target) {
      out.target = a;
    }
  }

  return out;
}

export default {
  name: "ls",
  desc: "list directory contents",
  async run(args, rl, ctx) {
    const opts = parseArgs(args);
    const base = ctx.state.cwd || process.cwd();

    const rawTarget = opts.target ? expandHome(opts.target) : base;
    const dir = path.isAbsolute(rawTarget) ? rawTarget : path.resolve(base, rawTarget);

    let entries;
    try {
      entries = fs.readdirSync(dir, { withFileTypes: true });
    } catch (e) {
      console.log("\n" + theme.err("cannot read directory") + "\n");
      console.log(hint("try: ls  |  ls -a  |  ls .."));
      console.log("");
      return;
    }

    // Build rows
    let rows = entries
      .filter((d) => opts.all || !d.name.startsWith("."))
      .map((d) => {
        const full = path.join(dir, d.name);

        let stat = null;
        try {
          stat = fs.statSync(full);
        } catch {
          stat = null;
        }

        const isDir = d.isDirectory();
        const isSym = d.isSymbolicLink?.() || false;

        const type = isDir ? theme.ok("dir") : isSym ? theme.warn("lnk") : theme.dim("file");

      const nameStyled = d.name.startsWith(".")
  ? theme.dim(d.name)
  : isDir
    ? theme.text(d.name + "/")
    : theme.text(d.name);

const size = stat && !isDir ? theme.dim(fmtBytes(stat.size)) : theme.dim("");
const mtime = stat ? theme.dim(fmtTime(stat.mtime)) : theme.dim("");

        return {
          name: d.name,
          isDir,
          sizeNum: stat?.size ?? 0,
          timeNum: stat?.mtimeMs ?? 0,
          row: opts.long ? [type, nameStyled, size, mtime] : [type, nameStyled],
        };
      });

    // Sort
    if (opts.sort === "name") {
      rows.sort((a, b) => a.name.localeCompare(b.name));
    } else if (opts.sort === "time") {
      rows.sort((a, b) => b.timeNum - a.timeNum);
    } else if (opts.sort === "size") {
      rows.sort((a, b) => b.sizeNum - a.sizeNum);
    }

    console.log("\n" + section(path.relative(base, dir) || "."));

    if (!rows.length) {
      console.log(theme.dim("(empty)"));
      console.log("");
      return;
    }

    if (opts.long) {
      console.log(
        table(["type", "name", "size", "modified"], rows.map((r) => r.row), {
          colWidths: [6, 34, 10, 18],
        })
      );
      console.log(hint("ls -a  |  ls -l  |  ls --sort time"));
      console.log("");
      return;
    }

    console.log(
      table(["type", "name"], rows.map((r) => r.row), {
        colWidths: [6, 46],
      })
    );
    console.log(hint("ls -l  |  ls -a  |  ls --sort time"));
    console.log("");
  },
};
