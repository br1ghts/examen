#!/usr/bin/env node

import readline from "readline";

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
  prompt: "examen > "
});

console.clear();
console.log("Welcome to examen!");
console.log("examen v0.0.1");
console.log("type 'help' to begin\n");

rl.prompt();

rl.on("line", (line) => {
  const input = line.trim();

  if (!input) {
    rl.prompt();
    return;
  }

  if (input === "exit" || input === "quit") {
    console.log("shutting down examen...");
    rl.close();
    return;
  }

  if (input === "help") {
    console.log("\ncommands:");
    console.log("  help  - show commands");
    console.log("  exit  - shutdown examen\n");
    rl.prompt();
    return;
  }

  console.log(`unknown command: ${input}`);
  rl.prompt();
});

rl.on("close", () => {
  process.exit(0);
});
