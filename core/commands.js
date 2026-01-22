import fs from "fs";
import path from "path";
import { fileURLToPath, pathToFileURL } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function addCommand(commands, cmd, sourceLabel) {
  if (!cmd || typeof cmd.name !== "string" || typeof cmd.run !== "function") {
    console.warn(`[examen] skipping invalid command from ${sourceLabel}`);
    return;
  }

  if (commands[cmd.name]) {
    console.warn(`[examen] duplicate command '${cmd.name}' from ${sourceLabel} (skipping)`);
    return;
  }

  commands[cmd.name] = {
    desc: cmd.desc || "",
    run: (args, rl, ctx) => cmd.run(args, rl, ctx)
  };
}

async function loadCommandsDir(commands, commandsDir) {
  if (!fs.existsSync(commandsDir)) return;

  const files = fs.readdirSync(commandsDir).filter((f) => f.endsWith(".js")).sort();
  for (const file of files) {
    const fullPath = path.join(commandsDir, file);
    const mod = await import(pathToFileURL(fullPath).href);
    addCommand(commands, mod.default, `commands/${file}`);
  }
}

async function loadModules(commands, modulesDir, modulesLoaded) {
  if (!fs.existsSync(modulesDir)) return;

  const moduleNames = fs
    .readdirSync(modulesDir, { withFileTypes: true })
    .filter((d) => d.isDirectory())
    .map((d) => d.name)
    .sort();

  for (const name of moduleNames) {
    const entry = path.join(modulesDir, name, "index.js");
    if (!fs.existsSync(entry)) continue;

    const mod = await import(pathToFileURL(entry).href);

    // module default export should be a function returning an array of commands
    if (typeof mod.default !== "function") {
      console.warn(`[examen] module '${name}' has no default function export (skipping)`);
      continue;
    }

    const moduleCommands = mod.default();
    if (!Array.isArray(moduleCommands)) {
      console.warn(`[examen] module '${name}' did not return an array of commands (skipping)`);
      continue;
    }
    modulesLoaded.push(name);
    for (const cmd of moduleCommands) {
      addCommand(commands, cmd, `modules/${name}`);
    }
  }
}

export async function loadCommands(state) {
  const root = path.resolve(__dirname, "..");
  const commandsDir = path.join(root, "commands");
  const modulesDir = path.join(root, "modules");

  const commands = {};
  const modulesLoaded = [];

  // Load core commands first
  await loadCommandsDir(commands, commandsDir);

  // Load modules after
  await loadModules(commands, modulesDir, modulesLoaded);

  const ctx = { state, commands, modulesLoaded };
  return { commands, ctx };
}
