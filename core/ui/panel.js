import boxen from "boxen";
import { theme } from "./theme.js";

function padRight(s, n) {
  const str = String(s ?? "");
  return str.length >= n ? str : str + " ".repeat(n - str.length);
}

export function panel(title, rows, opts = {}) {
  // rows: Array<[label, value]>
  const labelWidth = Math.max(6, ...rows.map(([k]) => String(k).length));

  const body = rows
    .map(([k, v]) => {
      const left = theme.label(padRight(k, labelWidth));
      const right = theme.text(String(v ?? ""));
      return `${left} ${theme.dim("│")} ${right}`;
    })
    .join("\n");

  const header = theme.header(String(title).toUpperCase());

  return boxen(body, {
    title: header,
    titleAlignment: "center",
    padding: { top: 0, right: 1, bottom: 0, left: 1 },
    margin: 0,
    borderStyle: "round",
    borderColor: opts.borderColor || "gray",
  });
}
