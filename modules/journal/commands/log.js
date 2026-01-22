import { appendEntry } from "../storage.js";

export default {
  name: "log",
  desc: "add a journal entry: log <text>",
  run(args, rl, ctx) {
    const text = args.join(" ").trim();
    if (!text) {
      console.log("usage: log <text>");
      return;
    }

    const entry = {
      ts: new Date().toISOString(),
      text
    };

    appendEntry(entry);
    console.log("logged.");
  }
};
