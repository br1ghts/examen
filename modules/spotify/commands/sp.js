import { loadConfig, loadToken, clearToken, getSpotifyPaths } from "../storage.js";
import { apiRequest } from "../http.js";
import { runPkceAuth, refreshAccessTokenIfNeeded } from "../auth.js";
import { panel, table, section, hint, theme } from "../../../core/ui/index.js";

const SCOPES = [
  "user-modify-playback-state",
  "user-read-playback-state",
];

function usage() {
  console.log("\nusage:");
  console.log("  sp setup                  open config + explain setup");
  console.log("  sp auth                   authenticate (PKCE)");
  console.log("  sp status                 show auth status");
  console.log("  sp now                    show current playback");
  console.log("  sp next                   skip to next track (Premium)");
  console.log("  sp prev                   skip to previous track (Premium)");
  console.log("  sp play                   resume playback (Premium)");
  console.log("  sp pause                  pause playback (Premium)");
  console.log("  sp devices                list devices");
  console.log("  sp use <n|id>              transfer playback to device (and play)");
  console.log("  sp transfer <n|id>         transfer playback (use --play to start)");
  console.log("  sp logout                 remove stored token\n");
}

async function getAccessTokenOrThrow() {
  const tok = await refreshAccessTokenIfNeeded();
  if (!tok?.access_token) throw new Error("not authenticated. Run: sp auth");
  return tok.access_token;
}

function fmtNowPanel(res) {
  const item = res.data?.item;
  const device = res.data?.device;

  const name = item?.name || "(unknown)";
  const artists = (item?.artists || []).map((a) => a.name).join(", ");
  const deviceName = device?.name || "(unknown)";
  const status = res.data?.is_playing ? "playing" : "paused";

  return panel("spotify", [
    ["device", deviceName + (device?.is_active ? " (active)" : "")],
    ["track", `${name}${artists ? " — " + artists : ""}`],
    ["status", status],
  ]);
}

function printDevicesTable(devices) {
  console.log(section("devices"));

  const rows = devices.map((d, i) => {
    const mark = d.is_active ? theme.ok("*") : theme.dim(" ");
    const idx = theme.dim(String(i + 1));
    const name = theme.text(d.name);
    const type = theme.dim(d.type);
    const id = theme.dim((d.id || "").slice(0, 8) || "--------");
    return [mark, idx, name, type, id];
  });

  console.log(
    table(["st", "#", "name", "type", "id"], rows, {
      colWidths: [4, 4, 30, 14, 12],
    })
  );

  console.log(hint("sp use <number>  |  sp play  |  sp pause"));
  console.log("");
}

function getSpotifyReason(err) {
  return err?.data?.error?.reason || err?.data?.error?.message || err?.message || "unknown error";
}

async function fetchDevices(access) {
  const res = await apiRequest("GET", "https://api.spotify.com/v1/me/player/devices", access);
  return res.data?.devices || [];
}

async function autoWakeDeviceOrGuide(access) {
  const devices = await fetchDevices(access);

  if (!devices.length) {
    console.log("\n(no devices — open Spotify on your phone or start playback)\n");
    console.log(hint("then run: sp devices"));
    console.log("");
    return { action: "none" };
  }

  const active = devices.find((d) => d.is_active);
  if (active?.id) return { action: "active", deviceId: active.id };

  if (devices.length === 1 && devices[0]?.id) {
    // If there’s only one option, be helpful and transfer+play
    await apiRequest("PUT", "https://api.spotify.com/v1/me/player", access, {
      device_ids: [devices[0].id],
      play: true,
    });
    console.log("\ntransferred to the only available device. (playing)\n");
    return { action: "transferred", deviceId: devices[0].id };
  }

  // Multiple devices: show table, let user choose
  console.log("\nno active device found.\n");
  printDevicesTable(devices);
  console.log(hint("pick one: sp use <number>"));
  console.log("");
  return { action: "choose" };
}

export default {
  name: "sp",
  desc: "spotify controls: sp auth|now|next|prev|devices",
  async run(args) {
    try {
      const sub = (args[0] || "").toLowerCase();
      if (!sub || sub === "help") return usage();

      if (sub === "setup") {
        const cfg = loadConfig();
        const { CONFIG_FILE } = getSpotifyPaths();
        console.log("\nspotify setup");
        console.log(`  config: ${CONFIG_FILE}`);
        console.log("\n1) Create a Spotify Developer app (Dashboard)");
        console.log("2) Put your client_id in config.json");
        console.log("3) Add this Redirect URI in Spotify app settings:");
        console.log(`   ${cfg.redirect_uri}`);
        console.log("\nTip: if 'localhost' gives you trouble, use 127.0.0.1 like above.\n");
        return;
      }

      if (sub === "status") {
        const cfg = loadConfig();
        const tok = loadToken();
        console.log("\nspotify status");
        console.log(`  client_id:     ${cfg.client_id ? "(set)" : "(missing)"}`);
        console.log(`  redirect_uri:  ${cfg.redirect_uri}`);
        console.log(`  token:         ${tok?.refresh_token ? "(saved)" : "(missing)"}`);
        console.log("");
        return;
      }

      if (sub === "auth") {
        await runPkceAuth(SCOPES);
        console.log("\nspotify authorized.\n");
        return;
      }

      if (sub === "logout") {
        clearToken();
        console.log("\nspotify token removed.\n");
        return;
      }

      if (sub === "now") {
        const access = await getAccessTokenOrThrow();
        const res = await apiRequest("GET", "https://api.spotify.com/v1/me/player", access);

        if (!res.data) {
          console.log("\n(no active playback)\n");
          console.log(hint("try: sp devices  |  sp use <n>  |  sp play"));
          console.log("");
          return;
        }

        console.log(fmtNowPanel(res));
        return;
      }

      if (sub === "devices") {
        const access = await getAccessTokenOrThrow();
        const devices = await fetchDevices(access);

        if (!devices.length) {
          console.log("\n(no devices — open Spotify on your phone or start playback)\n");
          return;
        }

        printDevicesTable(devices);
        return;
      }

      if (sub === "use" || sub === "transfer") {
        const access = await getAccessTokenOrThrow();
        const target = (args[1] || "").trim();
        const playFlag = args.includes("--play") || args.includes("-p") || sub === "use";

        if (!target) {
          console.log("\nusage: sp use <number|deviceId>\n");
          console.log(hint("sp devices  (to see numbers)"));
          console.log("");
          return;
        }

        const devices = await fetchDevices(access);
        let deviceId = target;

        if (/^\d+$/.test(target)) {
          const idx = Number(target) - 1;
          if (idx < 0 || idx >= devices.length) {
            console.log("\ninvalid device number.\n");
            console.log(hint("run: sp devices"));
            console.log("");
            return;
          }
          deviceId = devices[idx]?.id;
        } else {
          const match = devices.find((d) => d.id && d.id.startsWith(target));
          if (match) deviceId = match.id;
        }

        if (!deviceId) {
          console.log("\ncould not resolve device id.\n");
          console.log(hint("run: sp devices"));
          console.log("");
          return;
        }

        await apiRequest("PUT", "https://api.spotify.com/v1/me/player", access, {
          device_ids: [deviceId],
          play: playFlag,
        });

        console.log(`\ntransferred.${playFlag ? " (playing)" : ""}\n`);
        return;
      }

      // Player controls: if NO_ACTIVE_DEVICE, guide or auto-transfer
      if (sub === "play") {
        const access = await getAccessTokenOrThrow();
        try {
          await apiRequest("PUT", "https://api.spotify.com/v1/me/player/play", access);
          console.log("\nplaying.\n");
        } catch (err) {
          const reason = getSpotifyReason(err);
          if (reason === "NO_ACTIVE_DEVICE" || err?.status === 404) {
            await autoWakeDeviceOrGuide(access);
            return;
          }
          throw err;
        }
        return;
      }

      if (sub === "pause" || sub === "stop") {
        const access = await getAccessTokenOrThrow();
        try {
          await apiRequest("PUT", "https://api.spotify.com/v1/me/player/pause", access);
          console.log("\npaused.\n");
        } catch (err) {
          const reason = getSpotifyReason(err);
          if (reason === "NO_ACTIVE_DEVICE" || err?.status === 404) {
            await autoWakeDeviceOrGuide(access);
            return;
          }
          throw err;
        }
        return;
      }

      if (sub === "next") {
        const access = await getAccessTokenOrThrow();
        try {
          await apiRequest("POST", "https://api.spotify.com/v1/me/player/next", access);
          console.log("\nskipped.\n");
        } catch (err) {
          const reason = getSpotifyReason(err);
          if (reason === "NO_ACTIVE_DEVICE" || err?.status === 404) {
            await autoWakeDeviceOrGuide(access);
            return;
          }
          throw err;
        }
        return;
      }

      if (sub === "prev") {
        const access = await getAccessTokenOrThrow();
        try {
          await apiRequest("POST", "https://api.spotify.com/v1/me/player/previous", access);
          console.log("\nprevious.\n");
        } catch (err) {
          const reason = getSpotifyReason(err);
          if (reason === "NO_ACTIVE_DEVICE" || err?.status === 404) {
            await autoWakeDeviceOrGuide(access);
            return;
          }
          throw err;
        }
        return;
      }

      usage();
    } catch (err) {
      // Clean error output (no stack trace in normal use)
      const msg = err?.message || "unknown error";
      const reason = getSpotifyReason(err);

      console.log(
        panel("spotify error", [
          ["message", msg],
          ["reason", reason],
        ])
      );

      console.log(hint("try: sp devices  |  sp use <n>  |  sp play"));
      console.log("");
    }
  },
};
