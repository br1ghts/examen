export default {
  name: "exit",
  desc: "shutdown examen",
  run(_, rl) {
    console.log("shutting down examen...");
    rl.close();
  }
};
