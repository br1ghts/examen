import { spawn } from "child_process";
import { loadApps } from "../storage.js";

export default {
  name: "run",
  desc: "run a saved app shortcut: run <name>",
  run(args) {
    const name = (args[0] || "").trim();
    if (!name) {
      console.log("usage: run <name>");
      return;
    }

    const data = loadApps();
    const cmd = data.apps?.[name];

    if (!cmd) {
      console.log(`no such app: ${name}`);
      console.log("try: apps");
      return;
    }

    console.log(`\n[run] ${name}: ${cmd}\n`);

    // shell=true so it can run compound commands (cd && ...)
    const p = spawn(cmd, { shell: true, stdio: "inherit" });

    p.on("exit", (code) => {
      if (code === 0) console.log(`\n[run] '${name}' finished.\n`);
      else console.log(`\n[run] '${name}' exited with code ${code}.\n`);
    });

    p.on("error", (err) => {
      console.log(`[run] failed: ${err.message}`);
    });
  }
};
