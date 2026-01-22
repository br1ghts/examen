export default {
  name: "help",
  desc: "show commands",
  run(_, rl, ctx) {
    console.log("\ncommands:");
    Object.keys(ctx.commands)
      .sort()
      .forEach((name) => {
        const desc = ctx.commands[name].desc || "";
        console.log(`  ${name}${desc ? " - " + desc : ""}`);
      });
    console.log("");
  }
};
