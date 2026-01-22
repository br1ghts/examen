import git from "./commands/git.js";

export default function registerGitModule() {
  // Return an array of command objects (same shape as commands/*)
  return [git];
}
