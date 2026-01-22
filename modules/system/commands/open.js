import fs from "fs";
import path from "path";
import os from "os";
import { spawn } from "child_process";
import { hint, theme } from "../../../core/ui/index.js";

function expandHome(p) {
  if (!p) return p;
  if (p === "~") return os.homedir();
  if (p.startsWith("~/")) return path.join(os.homedir(), p.slice(2));
  return p;
}

function isUrl(s) {
  return /^https?:\/\//i.test(s);
}

function parseArgs(args) {
  // open [-a AppName] [target]
  const out = { app: null, target: null };

  for (let i = 0; i < args.length; i++) {
    const a = args[i];
    if ((a === "-a" || a === "--app") && args[i + 1]) {
      out.app = args[i + 1];
      i++;
      continue;
    }
    if (!out.target) out.target = a;
  }

  return out;
}

function runOpen({ app, target }) {
  return new Promise((resolve, reject) => {
    const cmd = "open";
    const openArgs = [];

    if (app) openArgs.push("-a", app);
    openArgs.push(target);

    const child = spawn(cmd, openArgs, { stdio: "ignore" });

    child.on("error", reject);
    child.on("close", (code) => {
      if (code === 0) resolve();
      else reject(new Error(`open failed (code ${code})`));
    });
  });
}

export default {
  name: "open",
  desc: "open a file/folder/url in the default app (macOS)",
  async run(args, rl, ctx) {
    const { app, target: raw } = parseArgs(args);

    const base = ctx.state?.cwd || process.cwd();
    const targetArg = raw || ".";

    // URLs: pass through
    if (isUrl(targetArg)) {
      try {
        await runOpen({ app, target: targetArg });
        console.log("\n" + theme.dim("opened url") + "\n");
      } catch (e) {
        console.log("\n" + theme.err(e.message) + "\n");
      }
      return;
    }

    // Paths: resolve
    const expanded = expandHome(targetArg);
    const resolved = path.isAbsolute(expanded)
      ? expanded
      : path.resolve(base, expanded);

    if (!fs.existsSync(resolved)) {
      console.log("\n" + theme.err("not found") + "\n");
      console.log(hint("try: open .  |  ls  |  open ~/Downloads"));
      console.log("");
      return;
    }

    try {
      await runOpen({ app, target: resolved });
      console.log("\n" + theme.dim("opened") + "\n");
    } catch (e) {
      console.log("\n" + theme.err(e.message) + "\n");
      console.log(hint("try: open -a 'Visual Studio Code' ."));
      console.log("");
    }
  },
};
