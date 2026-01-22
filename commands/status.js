import { getPaths } from "../core/state.js";

export default {
  name: "status",
  desc: "show system status",
  run(_, rl, ctx) {
    const { STATE_FILE } = getPaths();
    const s = ctx.state;

    console.log("\nexamen status");
    console.log(`  user:      ${s.user}`);
    console.log(`  boots:     ${s.boots}`);
    console.log(`  last_boot: ${s.last_boot}`);
    console.log(`  state:     ${STATE_FILE}\n`);
  }
};
