export default {
  name: "quit",
  desc: "alias for exit",
  run(args, rl, ctx) {
    ctx.commands.exit.run(args, rl, ctx);
  }
};
