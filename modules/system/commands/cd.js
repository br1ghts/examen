import fs from "fs";
import path from "path";
import os from "os";
import { theme, hint } from "../../../core/ui/index.js";
import { saveState } from "../../../core/state.js";

function expandHome(p) {
  if (!p) return p;
  if (p === "~") return os.homedir();
  if (p.startsWith("~/")) return path.join(os.homedir(), p.slice(2));
  return p;
}

export default {
  name: "cd",
  desc: "change directory (updates examen context)",
  async run(args, rl, ctx) {
    const raw = args[0] || "~";
    const target = expandHome(raw);

    const next = path.isAbsolute(target)
      ? target
      : path.resolve(ctx.state.cwd, target);

    if (!fs.existsSync(next) || !fs.statSync(next).isDirectory()) {
      console.log("\n" + theme.err("not a directory") + "\n");
      console.log(hint("try: pwd  |  cd ..  |  cd ~"));
      console.log("");
      return;
    }

    ctx.state.cwd = next;
    saveState(ctx.state);

    // apply immediately for this process
    process.chdir(next);

    console.log("\n" + theme.dim(next) + "\n");
  },
};
