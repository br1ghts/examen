import { loadApps } from "../storage.js";

export default {
  name: "apps",
  desc: "list saved app shortcuts",
  run() {
    const data = loadApps();
    const names = Object.keys(data.apps || {}).sort();

    if (names.length === 0) {
      console.log("\n(no apps yet)\n");
      console.log("add one with:");
      console.log("  app add <name> <command...>\n");
      return;
    }

    console.log("\napps");
    for (const name of names) {
      console.log(`  ${name} -> ${data.apps[name]}`);
    }
    console.log("");
  }
};
