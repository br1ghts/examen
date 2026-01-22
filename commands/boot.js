export default {
  name: "boot",
  desc: "show boot info",
  run(_, rl, ctx) {
    const s = ctx.state;
    console.log("\nboot sequence");
    console.log(`  created_at: ${s.created_at}`);
    console.log(`  last_boot:  ${s.last_boot}`);
    console.log(`  boots:      ${s.boots}\n`);
  }
};
