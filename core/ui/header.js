import { theme } from "./theme.js";

export function section(title) {
  return `\n${theme.header(title.toLowerCase())}\n`;
}

export function hint(text) {
  return `${theme.dim("hint:")} ${theme.text(text)}`;
}
