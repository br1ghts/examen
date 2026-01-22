export { theme } from "./theme.js";
export { panel } from "./panel.js";
export { table } from "./table.js";
export { section, hint } from "./header.js";
export { examenBanner } from "./banner.js";
export { gradientLine, statusStrip } from "./divider.js";


export const cell = {
  text: (s) => theme.text(s),
  dim: (s) => theme.dim(s),
  ok: (s) => theme.ok(s),
  warn: (s) => theme.warn(s),
  err: (s) => theme.err(s),
};
