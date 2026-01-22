import { spawn, spawnSync } from "child_process";
import { getLauncherPaths, loadApps, saveApps } from "../storage.js";

function usage() {
  console.log("\nusage:");
  console.log("  app add <name> <command...>");
  console.log("  app rm <name>");
  console.log("  app edit\n");
  console.log("examples:");
  console.log("  app add pipeline cd ~/Coding/pipeline && code .");
  console.log("  app add obsidian open -a Obsidian");
  console.log("  app rm pipeline");
  console.log("  app edit\n");
}


function commandExists(cmd) {
  const res = spawnSync("command", ["-v", cmd], { shell: true, stdio: "ignore" });
  return res.status === 0;
}

function openInEditor(filePath) {
  const preferred = (process.env.EDITOR || "").trim();

  const candidates = [
    preferred,
    "code", // VS Code CLI, if installed
  ].filter(Boolean);

  const editor = candidates.find(commandExists);

  if (editor) {
    const p = spawn(`${editor} "${filePath}"`, {
      stdio: "inherit",
      shell: true
    });

    p.on("error", () => console.log(`failed to run editor '${editor}'`));
    return;
  }

  // Fallback: platform opener
  const opener =
    process.platform === "darwin" ? "open" :
    process.platform === "win32" ? "start" :
    "xdg-open";

  spawn(opener, [filePath], { stdio: "inherit", shell: process.platform === "win32" });
}

export default {
  name: "app",
  desc: "manage app shortcuts: app add|rm|edit",
  run(args) {
    const sub = (args[0] || "").toLowerCase();

    if (!sub || sub === "help") return usage();

    if (sub === "add") {
      const name = (args[1] || "").trim();
      const command = args.slice(2).join(" ").trim();

      if (!name || !command) return usage();

      const data = loadApps();
      data.apps = data.apps || {};
      data.apps[name] = command;
      saveApps(data);

      console.log(`saved app '${name}'.`);
      return;
    }

    if (sub === "rm") {
      const name = (args[1] || "").trim();
      if (!name) return usage();

      const data = loadApps();
      if (!data.apps || !data.apps[name]) {
        console.log(`no such app: ${name}`);
        return;
      }

      delete data.apps[name];
      saveApps(data);

      console.log(`removed app '${name}'.`);
      return;
    }

    if (sub === "edit") {
      const { APPS_FILE } = getLauncherPaths();
      openInEditor(APPS_FILE);
      return;
    }

    usage();
  }
};
