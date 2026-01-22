import { loadConfig, loadToken, clearToken, getSpotifyPaths } from "../storage.js";
import { apiRequest } from "../http.js";
import { runPkceAuth, refreshAccessTokenIfNeeded } from "../auth.js";

const SCOPES = [
  "user-modify-playback-state", // next/prev etc  [oai_citation:4‡Spotify for Developers](https://developer.spotify.com/documentation/web-api/concepts/scopes?utm_source=chatgpt.com)
  "user-read-playback-state"    // now/devices  [oai_citation:5‡Spotify for Developers](https://developer.spotify.com/documentation/web-api/reference/get-information-about-the-users-current-playback?utm_source=chatgpt.com)
];

function usage() {
  console.log("\nusage:");
  console.log("  sp setup                 open config + explain setup");
  console.log("  sp auth                  authenticate (PKCE)");
  console.log("  sp status                show auth status");
  console.log("  sp now                   show current playback");
  console.log("  sp next                  skip to next track (Premium)"); //  [oai_citation:6‡Spotify for Developers](https://developer.spotify.com/documentation/web-api/reference/skip-users-playback-to-next-track?utm_source=chatgpt.com)
  console.log("  sp prev                  skip to previous track (Premium)");
  console.log("  sp devices               list devices");
  console.log("  sp logout                remove stored token\n");
  console.log("  sp play                  resume playback (Premium)");
  console.log("  sp pause                 pause playback (Premium)");
    console.log("  sp use <n|id>            transfer playback to device (and play)");
  console.log("  sp transfer <n|id>       transfer playback (use --play to start)");
}

async function getAccessTokenOrThrow() {
  const tok = await refreshAccessTokenIfNeeded();
  if (!tok?.access_token) throw new Error("not authenticated. Run: sp auth");
  return tok.access_token;
}

export default {
  name: "sp",
  desc: "spotify controls: sp auth|now|next|prev|devices",
  async run(args) {
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
      await runPkceAuth(SCOPES); // PKCE recommended for installed apps  [oai_citation:7‡Spotify for Developers](https://developer.spotify.com/documentation/web-api/tutorials/code-pkce-flow?utm_source=chatgpt.com)
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
      const res = await apiRequest("GET", "https://api.spotify.com/v1/me/player", access); //  [oai_citation:8‡Spotify for Developers](https://developer.spotify.com/documentation/web-api/reference/get-information-about-the-users-current-playback?utm_source=chatgpt.com)
      if (!res.data) {
        console.log("\n(no active playback)\n");
        return;
      }
      const item = res.data.item;
      const device = res.data.device;
      const name = item?.name || "(unknown)";
      const artists = (item?.artists || []).map(a => a.name).join(", ");
      console.log(`\nnow playing`);
      console.log(`  ${name}${artists ? " — " + artists : ""}`);
      console.log(`  device: ${device?.name || "(unknown)"}${device?.is_active ? " (active)" : ""}\n`);
      return;
    }

    if (sub === "devices") {
      const access = await getAccessTokenOrThrow();
      const res = await apiRequest("GET", "https://api.spotify.com/v1/me/player/devices", access);
      const devices = res.data?.devices || [];

      if (!devices.length) {
        console.log("\n(no devices — open Spotify on your phone or start playback)\n");
        return;
      }

      console.log("\ndevices");
      devices.forEach((d, i) => {
        const mark = d.is_active ? "*" : " ";
        const shortId = d.id ? d.id.slice(0, 8) : "--------";
        console.log(`  ${mark} [${i + 1}] ${d.name} (${d.type})  id:${shortId}`);
      });
      console.log("");
      console.log("tip: sp use <number>  (transfers playback to that device)");
      console.log("");
      return;
    }
    if (sub === "use" || sub === "transfer") {
      const access = await getAccessTokenOrThrow();
      const target = (args[1] || "").trim();
      const playFlag = args.includes("--play") || args.includes("-p") || sub === "use";

      if (!target) {
        console.log("\nusage: sp use <number|deviceId>\n");
        console.log("tip: sp devices  (to see numbers)\n");
        return;
      }

      const res = await apiRequest("GET", "https://api.spotify.com/v1/me/player/devices", access);
      const devices = res.data?.devices || [];

      let deviceId = target;

      // If numeric, resolve from list
      if (/^\d+$/.test(target)) {
        const idx = Number(target) - 1;
        if (idx < 0 || idx >= devices.length) {
          console.log("\ninvalid device number. run: sp devices\n");
          return;
        }
        deviceId = devices[idx]?.id;
      } else {
        // If they passed a short id, try to match prefix
        const match = devices.find(d => d.id && d.id.startsWith(target));
        if (match) deviceId = match.id;
      }

      if (!deviceId) {
        console.log("\ncould not resolve device id. run: sp devices\n");
        return;
      }

      await apiRequest("PUT", "https://api.spotify.com/v1/me/player", access, {
        device_ids: [deviceId],
        play: playFlag
      });

      console.log(`\ntransferred.${playFlag ? " (playing)" : ""}\n`);
      return;
    }
    if (sub === "next") {
      const access = await getAccessTokenOrThrow();
      await apiRequest("POST", "https://api.spotify.com/v1/me/player/next", access); // Premium-only  [oai_citation:9‡Spotify for Developers](https://developer.spotify.com/documentation/web-api/reference/skip-users-playback-to-next-track?utm_source=chatgpt.com)
      console.log("\nskipped.\n");
      return;
    }

    if (sub === "prev") {
      const access = await getAccessTokenOrThrow();
      await apiRequest("POST", "https://api.spotify.com/v1/me/player/previous", access);
      console.log("\nprevious.\n");
      return;
    }
    if (sub === "play") {
      const access = await getAccessTokenOrThrow();
      await apiRequest("PUT", "https://api.spotify.com/v1/me/player/play", access);
      console.log("\nplaying.\n");
      return;
    }

    if (sub === "pause") {
      const access = await getAccessTokenOrThrow();
      await apiRequest("PUT", "https://api.spotify.com/v1/me/player/pause", access);
      console.log("\npaused.\n");
      return;
    }
    usage();
  }
};
