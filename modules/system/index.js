import sys from "./commands/sys.js";
import status from "./commands/status.js";
import pwd from "./commands/pwd.js";
import cd from "./commands/cd.js";
import ls from "./commands/ls.js";
import open from "./commands/open.js";

export default function registerSystemModule() {
  return [sys, status, pwd, cd, ls, open];
}
