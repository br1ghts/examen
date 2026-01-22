import chalk from "chalk";

// Linear interpolate between two hex colors
function lerp(a, b, t) {
  return Math.round(a + (b - a) * t);
}
function hexToRgb(hex) {
  const h = hex.replace("#", "");
  return {
    r: parseInt(h.slice(0, 2), 16),
    g: parseInt(h.slice(2, 4), 16),
    b: parseInt(h.slice(4, 6), 16),
  };
}
function rgbToHex({ r, g, b }) {
  const to = (n) => n.toString(16).padStart(2, "0");
  return `#${to(r)}${to(g)}${to(b)}`;
}

// Apply gradient across ALL non-space characters (keeps it clean)
export function gradientAscii(ascii, from = "#5bc0eb", to = "#b388ff") {
  const start = hexToRgb(from);
  const end = hexToRgb(to);

  // Count "paintable" chars (exclude spaces/newlines)
  const chars = [...ascii];
  const paintableIdx = chars
    .map((c, i) => (c !== " " && c !== "\n" ? i : -1))
    .filter((i) => i !== -1);

  const total = Math.max(1, paintableIdx.length - 1);

  let k = 0;
  for (const i of paintableIdx) {
    const t = total === 0 ? 0 : k / total;
    const color = rgbToHex({
      r: lerp(start.r, end.r, t),
      g: lerp(start.g, end.g, t),
      b: lerp(start.b, end.b, t),
    });
    chars[i] = chalk.hex(color)(chars[i]);
    k++;
  }

  return chars.join("");
}

export function examenBanner({ version = null } = {}) {
  // Retro + clean + compact: doesn't eat your terminal
  const art = `███████╗██╗  ██╗ █████╗ ███╗   ███╗███████╗███╗   ██╗
██╔════╝╚██╗██╔╝██╔══██╗████╗ ████║██╔════╝████╗  ██║
█████╗   ╚███╔╝ ███████║██╔████╔██║█████╗  ██╔██╗ ██║
██╔══╝   ██╔██╗ ██╔══██║██║╚██╔╝██║██╔══╝  ██║╚██╗██║
███████╗██╔╝ ██╗██║  ██║██║ ╚═╝ ██║███████╗██║ ╚████║
╚══════╝╚═╝  ╚═╝╚═╝  ╚═╝╚═╝     ╚═╝╚══════╝╚═╝  ╚═══╝
`.trimEnd();

  const logo = gradientAscii(art, "#5bc0eb", "#b388ff");
  const meta = version ? `\n${chalk.hex("#777777")(`v${version}`)}` : "";

  return `${logo}${meta}`;
}
