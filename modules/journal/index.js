import log from "./commands/log.js";
import today from "./commands/today.js";

export default function registerJournalModule() {
  // Return an array of command objects (same shape as commands/*)
  return [log, today];
}
