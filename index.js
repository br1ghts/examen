#!/usr/bin/env node

import readline from "readline";
import { loadState, saveState } from "./core/state.js";
import { loadCommands } from "./core/commands.js";

console.clear();
console.log("examen v0.0.1");
console.log("type 'help' to begin\n");

// ---- State boot ----
let state = loadState();
state.last_boot = new Date().toISOString();
state.boots += 1;
saveState(state);

// ---- Shell ----
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
  prompt: "examen > "
});

// ---- Load commands ----
const { commands, ctx } = await loadCommands(state);

rl.prompt();

rl.on("line", (line) => {
  const input = line.trim();
  if (!input) return rl.prompt();

  const [cmd, ...args] = input.split(" ");

  if (commands[cmd]) {
    commands[cmd].run(args, rl, ctx);
  } else {
    console.log(`unknown command: ${cmd}`);
  }

  rl.prompt();
});

rl.on("close", () => process.exit(0));
