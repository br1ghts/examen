import Table from "cli-table3";
import { theme } from "./theme.js";

export function table(headers, rows, opts = {}) {
  const t = new Table({
    head: headers.map(h => theme.dim(h)),
    style: {
      head: [],
      border: [],
    },
    colWidths: opts.colWidths,
    wordWrap: true,
  });

  for (const r of rows) t.push(r);
  return t.toString();
}

// helpers for semantic cells
export const cell = {
  unread: (s) => theme.warn(String(s)),
  active: (s) => theme.ok(String(s)),
  dim: (s) => theme.dim(String(s)),
  text: (s) => theme.text(String(s)),
};
