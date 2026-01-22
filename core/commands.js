import fs from "fs";
import path from "path";
import { fileURLToPath, pathToFileURL } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export async function loadCommands(state) {
  const commandsDir = path.resolve(__dirname, "../commands");
  const files = fs
    .readdirSync(commandsDir)
    .filter((f) => f.endsWith(".js"))
    .sort();

  const commands = {};

  for (const file of files) {
    const fullPath = path.join(commandsDir, file);

    // Dynamic import needs a file URL
    const mod = await import(pathToFileURL(fullPath).href);

    const cmd = mod.default;

    if (!cmd || typeof cmd.name !== "string" || typeof cmd.run !== "function") {
      console.warn(`[examen] skipping invalid command file: ${file}`);
      continue;
    }

    // Pass shared state into the command (by reference)
    commands[cmd.name] = {
      desc: cmd.desc || "",
      run: (args, rl, ctx) => cmd.run(args, rl, ctx)
    };
  }

  // Provide help command a way to see the command registry
  const ctx = { state, commands };
  return { commands, ctx };
}
