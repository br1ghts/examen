import { getStatus } from "../../../core/status/getStatus.js";
import { renderThinStatus } from "../../../core/status/render.js";

export default {
  name: "status",
  desc: "show system status",
  async run(args, rl, ctx) {
    const s = await getStatus(ctx);
    console.log("\n" + renderThinStatus(s) + "\n");
  },
};
