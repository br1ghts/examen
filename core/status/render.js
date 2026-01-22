import path from "path";
import os from "os";
import { theme } from "../ui/index.js";

function shortHome(p) {
  const home = os.homedir();
  if (!p) return "";
  return p.startsWith(home) ? "~" + p.slice(home.length) : p;
}

export function renderThinStatus(s) {
  const parts = [];

  // core state
  parts.push(theme.dim(s.time));
  parts.push(theme.text("ready"));
  parts.push(theme.dim("·"));
  parts.push(theme.dim(shortHome(s.cwd)));
  parts.push(theme.dim("·"));
  parts.push(theme.dim(`up ${s.uptime}`));

  // signals
  if (typeof s.feedsUnread === "number") {
    parts.push(theme.dim("·"));
    parts.push(
      s.feedsUnread > 0
        ? theme.warn(`feeds:${s.feedsUnread}`)
        : theme.dim("feeds:0")
    );
  }

  if (typeof s.spotify === "string") {
    parts.push(theme.dim("·"));
    parts.push(s.spotify === "linked" ? theme.ok("sp:ok") : theme.dim("sp:none"));
  }

  // mode (future safety for file ops)
  parts.push(theme.dim("·"));
  parts.push(s.mode === "safe" ? theme.dim("mode:safe") : theme.warn(`mode:${s.mode}`));

  return parts.join(" ");
}
