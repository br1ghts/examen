#!/usr/bin/env node

import readline from "readline";

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
  }
};

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
  prompt: "examen > "
});

console.clear();
console.log("examen v0.0.1");
console.log("type 'help' to begin\n");

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
