import { isRepo, branchName, statusPorcelain, git } from "../../../core/git/index.js";
import { panel, table, cell, section, hint } from "../../../core/ui/index.js";

function usage() {
  console.log("\nusage:");
  console.log("  git                 pretty status");
  console.log("  git st              pretty status");
  console.log("  git <args...>       pass-through to system git\n");
}

function parsePorcelain(out) {
  const lines = out.split("\n").filter(Boolean);
  const head = lines.shift() || "";
  const changes = lines;

  // head example: "## dev...origin/dev [ahead 1]"
  const headLine = head.replace(/^##\s*/, "");
  return { headLine, changes };
}

function kindFromXY(xy) {
  if (xy.includes("A")) return cell.ok("add");
  if (xy.includes("D")) return cell.err("del");
  if (xy.includes("M")) return cell.warn("mod");
  if (xy.includes("R")) return cell.warn("ren");
  if (xy.includes("C")) return cell.warn("cpy");
  if (xy.includes("?")) return cell.dim("new");
  return cell.dim("chg");
}

function prettyStatus(cwd) {
  const res = statusPorcelain(cwd);
  if (!res.ok) {
    console.log(panel("git error", [["message", res.err || "failed"]]));
    console.log("");
    return;
  }

  const { headLine, changes } = parsePorcelain(res.out);
  const br = branchName(cwd) || "(unknown)";

  console.log(panel("git", [
    ["branch", headLine || br],
    ["changes", String(changes.length)],
  ]));

  if (!changes.length) {
    console.log(hint("clean working tree"));
    console.log("");
    return;
  }

  console.log(section("changes"));

  const rows = changes.map((l) => {
    const xy = l.slice(0, 2);
    const file = l.slice(3);

    return [
      kindFromXY(xy),
      cell.text(file),
      cell.dim(xy),
    ];
  });

  console.log(table(["type", "file", "xy"], rows, { colWidths: [8, 62, 6] }));
  console.log(hint("pass-through: git add .  |  git commit -m \"msg\"  |  git push"));
  console.log("");
}

export default {
  name: "git",
  desc: "git wrapper: pretty status + pass-through",
  run(args) {
    const sub = (args[0] || "").toLowerCase();
    const cwd = process.cwd();

    if (!sub) {
      if (!isRepo(cwd)) {
        console.log(panel("git", [["repo", "not a git repo here"]]));
        console.log("");
        return;
      }
      prettyStatus(cwd);
      return;
    }

    if (sub === "help") return usage();
    if (sub === "st" || sub === "status") {
      if (!isRepo(cwd)) {
        console.log(panel("git", [["repo", "not a git repo here"]]));
        console.log("");
        return;
      }
      prettyStatus(cwd);
      return;
    }

    // pass-through
    const res = git(args, { cwd });
    if (res.out) process.stdout.write(res.out + "\n");
    if (!res.ok && res.err) process.stderr.write(res.err + "\n");
  }
};
