import { theme } from "../../../core/ui/index.js";

export default {
  name: "pwd",
  desc: "print working directory",
  async run(args, rl, ctx) {
    console.log("\n" + theme.dim(ctx.state.cwd) + "\n");
  },
};
