import chalk from "chalk";

function lerp(a, b, t) {
  return Math.round(a + (b - a) * t);
}
function hexToRgb(hex) {
  const h = hex.replace("#", "");
  return { r: parseInt(h.slice(0, 2), 16), g: parseInt(h.slice(2, 4), 16), b: parseInt(h.slice(4, 6), 16) };
}
function rgbToHex({ r, g, b }) {
  const to = (n) => n.toString(16).padStart(2, "0");
  return `#${to(r)}${to(g)}${to(b)}`;
}

export function gradientLine(width = process.stdout.columns || 80, from = "#5bc0eb", to = "#b388ff") {
  const start = hexToRgb(from);
  const end = hexToRgb(to);

  const chars = Array.from({ length: Math.max(10, width) }, () => "─");
  const total = Math.max(1, chars.length - 1);

  return chars
    .map((ch, i) => {
      const t = i / total;
      const color = rgbToHex({
        r: lerp(start.r, end.r, t),
        g: lerp(start.g, end.g, t),
        b: lerp(start.b, end.b, t),
      });
      return chalk.hex(color)(ch);
    })
    .join("");
}

export function statusStrip(text) {
  return chalk.hex("#777777")(text);
}
