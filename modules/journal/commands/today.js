import { readEntries } from "../storage.js";

function isSameLocalDay(a, b) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

export default {
  name: "today",
  desc: "show today's journal entries",
  run(_, rl, ctx) {
    const entries = readEntries();
    const now = new Date();

    const todays = entries.filter((e) => {
      const d = new Date(e.ts);
      return isSameLocalDay(d, now);
    });

    if (todays.length === 0) {
      console.log("\n(no entries today)\n");
      return;
    }

    console.log("");
    for (const e of todays) {
      const t = new Date(e.ts).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
      console.log(`[${t}] ${e.text}`);
    }
    console.log("");
  }
};
