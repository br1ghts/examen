import chalk from "chalk";

export const theme = {
  // text tones
  text: chalk.hex("#e6e6e6"),
  dim: chalk.hex("#777777"),
  faint: chalk.hex("#555555"),

  // accents (tiny cyberpunk)
  cyan: chalk.hex("#5bc0eb"),
  purple: chalk.hex("#b388ff"),
  amber: chalk.hex("#f2b84b"),
  green: chalk.hex("#5cff8d"),
  red: chalk.hex("#ff6b6b"),

  // semantic usage
  header: chalk.hex("#5bc0eb"),      // cyan
  label: chalk.hex("#b388ff"),       // purple
  ok: chalk.hex("#5cff8d"),          // green
  warn: chalk.hex("#f2b84b"),        // amber
  err: chalk.hex("#ff6b6b"),         // red
};
