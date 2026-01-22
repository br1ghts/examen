#!/usr/bin/env node

import readline from "readline";
import { loadState, saveState } from "./core/state.js";
import { loadCommands } from "./core/commands.js";
import { examenBanner, hint,gradientLine, statusStrip  } from "./core/ui/index.js";
// ---- Shell (init first) ----
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
  prompt: "examen > "
});

// ---- Boot render (after rl exists) ----
console.clear();
console.log(examenBanner({ version: "0.0.1" }));
console.log(hint("Type 'help' to see available commands."));
console.log(gradientLine());
console.log("");

// ---- State boot ----
let state = loadState();
state.last_boot = new Date().toISOString();
state.boots += 1;
saveState(state);

state.cwd = state.cwd || process.cwd();
state.mode = state.mode || "safe";
saveState(state);

// ---- Load commands ----
const { commands, ctx } = await loadCommands(state);

// prompt on next tick to avoid redraw artifacts
setTimeout(() => rl.prompt(), 0);

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
