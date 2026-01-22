export default {
  name: "whoami",
  desc: "show current user identity",
  run(_, rl, ctx) {
    console.log(`\n${ctx.state.user}\n`);
  }
};
