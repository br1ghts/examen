import { spawnSync } from "child_process";

function runGit(args, { cwd } = {}) {
  const res = spawnSync("git", args, {
    cwd,
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
  });

  return {
    ok: res.status === 0,
    code: res.status,
    out: (res.stdout || "").trimEnd(),
    err: (res.stderr || "").trimEnd(),
  };
}

export function isRepo(cwd) {
  const r = runGit(["rev-parse", "--is-inside-work-tree"], { cwd });
  return r.ok && r.out.trim() === "true";
}

export function branchName(cwd) {
  const r = runGit(["rev-parse", "--abbrev-ref", "HEAD"], { cwd });
  return r.ok ? r.out.trim() : null;
}

export function statusPorcelain(cwd) {
  // includes branch info + machine-readable changes
  return runGit(["status", "--porcelain=v1", "-b"], { cwd });
}

export function git(args, { cwd } = {}) {
  return runGit(args, { cwd });
}
