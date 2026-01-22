import http from "http";
import crypto from "crypto";
import { spawn } from "child_process";
import { loadConfig, saveToken, loadToken } from "./storage.js";

function base64url(buf) {
  return buf
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");
}

function sha256(input) {
  return crypto.createHash("sha256").update(input).digest();
}

function openBrowser(url) {
  const cmd =
    process.platform === "darwin" ? "open" :
    process.platform === "win32" ? "start" :
    "xdg-open";

  spawn(cmd, [url], { stdio: "ignore", shell: process.platform === "win32" });
}

function parseRedirect(redirectUri) {
  const u = new URL(redirectUri);
  return {
    host: u.hostname,
    port: Number(u.port || (u.protocol === "https:" ? 443 : 80)),
    path: u.pathname
  };
}

async function exchangeCodeForToken({ client_id, redirect_uri, code, code_verifier }) {
  const params = new URLSearchParams();
  params.set("grant_type", "authorization_code");
  params.set("client_id", client_id);
  params.set("code", code);
  params.set("redirect_uri", redirect_uri);
  params.set("code_verifier", code_verifier);

  const res = await fetch("https://accounts.spotify.com/api/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: params.toString()
  });

  const data = await res.json();
  if (!res.ok) {
    const msg = data?.error_description || data?.error || "token exchange failed";
    throw new Error(msg);
  }

  return data; // access_token, refresh_token, expires_in, token_type, scope
}

export async function refreshAccessTokenIfNeeded() {
  const cfg = loadConfig();
  const tok = loadToken();
  if (!tok?.refresh_token) return null;

  const now = Math.floor(Date.now() / 1000);
  // refresh a bit early
  if (tok.expires_at && now < tok.expires_at - 60 && tok.access_token) return tok;

  const params = new URLSearchParams();
  params.set("grant_type", "refresh_token");
  params.set("refresh_token", tok.refresh_token);
  params.set("client_id", cfg.client_id);

  const res = await fetch("https://accounts.spotify.com/api/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: params.toString()
  });

  const data = await res.json();
  if (!res.ok) {
    const msg = data?.error_description || data?.error || "refresh failed";
    throw new Error(msg);
  }

  const expires_at = Math.floor(Date.now() / 1000) + (data.expires_in || 3600);

  const updated = {
    ...tok,
    access_token: data.access_token,
    expires_at
    // refresh_token usually not returned on refresh; keep existing
  };

  saveToken(updated);
  return updated;
}

export async function runPkceAuth(scopes) {
  const cfg = loadConfig();
  if (!cfg.client_id) {
    throw new Error("spotify client_id missing. Set it in ~/.examen/spotify/config.json");
  }

  // PKCE verifier/challenge (recommended flow for installed apps)  [oai_citation:3‡Spotify for Developers](https://developer.spotify.com/documentation/web-api/tutorials/code-pkce-flow?utm_source=chatgpt.com)
  const code_verifier = base64url(crypto.randomBytes(48));
  const code_challenge = base64url(sha256(code_verifier));

  const state = base64url(crypto.randomBytes(16));
  const authUrl = new URL("https://accounts.spotify.com/authorize");
  authUrl.searchParams.set("response_type", "code");
  authUrl.searchParams.set("client_id", cfg.client_id);
  authUrl.searchParams.set("redirect_uri", cfg.redirect_uri);
  authUrl.searchParams.set("code_challenge_method", "S256");
  authUrl.searchParams.set("code_challenge", code_challenge);
  authUrl.searchParams.set("state", state);
  authUrl.searchParams.set("scope", scopes.join(" "));

  const { host, port, path } = parseRedirect(cfg.redirect_uri);

  const code = await new Promise((resolve, reject) => {
    const server = http.createServer((req, res) => {
      try {
        const reqUrl = new URL(req.url, `http://${req.headers.host}`);
        if (reqUrl.pathname !== path) {
          res.writeHead(404);
          res.end("Not found");
          return;
        }

        const returnedState = reqUrl.searchParams.get("state");
        const returnedCode = reqUrl.searchParams.get("code");
        const err = reqUrl.searchParams.get("error");

        if (err) {
          res.writeHead(200, { "Content-Type": "text/plain" });
          res.end(`Spotify auth error: ${err}\nYou can close this tab.`);
          server.close();
          return reject(new Error(`Spotify auth error: ${err}`));
        }

        if (returnedState !== state) {
          res.writeHead(200, { "Content-Type": "text/plain" });
          res.end("State mismatch. You can close this tab.");
          server.close();
          return reject(new Error("state mismatch"));
        }

        if (!returnedCode) {
          res.writeHead(200, { "Content-Type": "text/plain" });
          res.end("No code returned. You can close this tab.");
          server.close();
          return reject(new Error("no code returned"));
        }

        res.writeHead(200, { "Content-Type": "text/plain" });
        res.end("Spotify authorized. You can close this tab and return to the terminal.");
        server.close();
        resolve(returnedCode);
      } catch (e) {
        server.close();
        reject(e);
      }
    });

    server.listen(port, host, () => {
      openBrowser(authUrl.toString());
    });

    server.on("error", reject);
  });

  const token = await exchangeCodeForToken({
    client_id: cfg.client_id,
    redirect_uri: cfg.redirect_uri,
    code,
    code_verifier
  });

  const expires_at = Math.floor(Date.now() / 1000) + (token.expires_in || 3600);

  saveToken({
    access_token: token.access_token,
    refresh_token: token.refresh_token,
    scope: token.scope,
    token_type: token.token_type,
    expires_at
  });

  return true;
}
