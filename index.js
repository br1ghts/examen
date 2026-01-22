#!/usr/bin/env node

import readline from "readline";
import { loadState, saveState, getPaths } from "./core/state.js";
const commands = {
  help: {
    desc: "show commands",
    run() {
      console.log("\ncommands:");
      Object.keys(commands).forEach(cmd => {
        console.log(`  ${cmd} - ${commands[cmd].desc}`);
      });
      console.log("");
    }
  },

  exit: {
    desc: "shutdown examen",
    run(_, rl) {
      console.log("shutting down examen...");
      rl.close();
    }
  },

  quit: {
    desc: "alias for exit",
    run(_, rl) {
      console.log("shutting down examen...");
      rl.close();
    }
  },
  status: {
  desc: "show system status",
  run() {
    const { STATE_FILE } = getPaths();
    console.log("\nexamen status");
    console.log(`  user:      ${state.user}`);
    console.log(`  boots:     ${state.boots}`);
    console.log(`  last_boot: ${state.last_boot}`);
    console.log(`  state:     ${STATE_FILE}\n`);
  }
},

whoami: {
  desc: "show current user identity",
  run() {
    console.log(`\n${state.user}\n`);
  }
},

boot: {
  desc: "show boot info",
  run() {
    console.log("\nboot sequence");
    console.log(`  created_at: ${state.created_at}`);
    console.log(`  last_boot:  ${state.last_boot}`);
    console.log(`  boots:      ${state.boots}\n`);
  }
},
};

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
  prompt: "examen > "
});

console.clear();
console.log("examen v0.0.1");
console.log("type 'help' to begin\n");

let state = loadState();
state.last_boot = new Date().toISOString();
state.boots += 1;
saveState(state);

rl.prompt();

rl.on("line", (line) => {
  const input = line.trim();
  if (!input) return rl.prompt();

  const [cmd, ...args] = input.split(" ");

  if (commands[cmd]) {
    commands[cmd].run(args, rl);
  } else {
    console.log(`unknown command: ${cmd}`);
  }

  rl.prompt();
});

rl.on("close", () => {
  process.exit(0);
});
