import apps from "./commands/apps.js";
import app from "./commands/app.js";
import run from "./commands/run.js";

export default function registerLauncherModule() {
  return [apps, app, run];
}
