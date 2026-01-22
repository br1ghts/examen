export { theme } from "./theme.js";
import { theme } from "./theme.js";
console.log("UI index loaded:", import.meta.url);
console.log("theme keys:", theme && Object.keys(theme));
export { panel } from "./panel.js";
export { table } from "./table.js";
export { section, hint } from "./header.js";
export { examenBanner } from "./banner.js";
export { gradientLine, statusStrip } from "./divider.js";


export const cell = {
  text: (s) => theme.text(s),
  dim: (s) => theme.dim(s),
  faint: (s) => theme.faint(s),

  ok: (s) => theme.ok(s),
  warn: (s) => theme.warn(s),
  err: (s) => theme.err(s),

  // common aliases used in modules
  active: (s) => theme.ok(s),
  unread: (s) => theme.purple(s), // or theme.cyan(s) if you want it louder
};
