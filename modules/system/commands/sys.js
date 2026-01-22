import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { getPaths, loadState } from "../../../core/state.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// repo root: modules/system/commands -> modules/system -> modules -> repo
const repoRoot = path.resolve(__dirname, "../../../..");
const pkgPath = path.join(repoRoot, "package.json");

function usage() {
  console.log("\nusage: sys <subcommand>\n");
  console.log("subcommands:");
  console.log("  status   show system status");
  console.log("  paths    show examen paths");
  console.log("  modules  list loaded modules");
  console.log("  version  show version info");
  console.log("  reset    reset state (deletes state.json)");
  console.log("");
}

export default {
  name: "sys",
  desc: "system commands: sys status|paths|modules|version|reset",
  run(args, rl, ctx) {
    const sub = (args[0] || "").toLowerCase();

    if (!sub || sub === "help") return usage();

    if (sub === "paths") {
      const { EXAMEN_DIR, STATE_FILE } = getPaths();
      console.log("\npaths");
      console.log(`  examen_dir: ${EXAMEN_DIR}`);
      console.log(`  state_file: ${STATE_FILE}\n`);
      return;
    }

    if (sub === "modules") {
      const mods = ctx.modulesLoaded || [];
      console.log("\nmodules loaded");
      if (mods.length === 0) console.log("  (none)");
      else mods.sort().forEach((m) => console.log(`  ${m}`));
      console.log("");
      return;
    }

    if (sub === "version") {
      let version = "unknown";
      try {
        const pkg = JSON.parse(fs.readFileSync(pkgPath, "utf8"));
        version = pkg.version || version;
      } catch {}

      console.log("\nversion");
      console.log(`  examen: ${version}`);
      console.log(`  node:   ${process.version}\n`);
      return;
    }

    if (sub === "status") {
      const { EXAMEN_DIR, STATE_FILE } = getPaths();
      const mods = ctx.modulesLoaded || [];

      console.log("\nsystem status");
      console.log(`  user:            ${ctx.state.user}`);
      console.log(`  boots:           ${ctx.state.boots}`);
      console.log(`  last_boot:       ${ctx.state.last_boot}`);
      console.log(`  commands_loaded: ${Object.keys(ctx.commands).length}`);
      console.log(`  modules_loaded:  ${mods.length}`);
      console.log(`  examen_dir:      ${EXAMEN_DIR}`);
      console.log(`  state_file:      ${STATE_FILE}\n`);
      return;
    }

    if (sub === "reset") {
      const { STATE_FILE } = getPaths();

      if (fs.existsSync(STATE_FILE)) {
        fs.unlinkSync(STATE_FILE);
        console.log("\nstate reset: deleted state.json");
      } else {
        console.log("\nstate reset: no state.json found");
      }

      // Reload state into memory so the session keeps working cleanly
      ctx.state = loadState();
      console.log("state recreated.\n");
      return;
    }

    usage();
  }
};
