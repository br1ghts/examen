export default {
  name: "clear",
  desc: "clear the screen",
  run() {
    // ANSI: clear screen + move cursor to top-left
    process.stdout.write("\x1Bc");
    // Fallback (some terminals prefer this)
    console.clear();
  }
};
