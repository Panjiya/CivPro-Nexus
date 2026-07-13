#!/usr/bin/env bash
# 02-provision.sh — provision the civpro-web LXC. Run INSIDE the LXC as root
# (pushed + executed via 01-create-lxc.sh's printed pct commands).
# Expects ./Caddyfile next to this script (pct push both — README-deploy.md Stage B).
# Next: tunnel setup — README-deploy.md Stage C (dashboard, recommended) or 03-tunnel-setup.sh (fallback).
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
DEPLOY_USER="deploy"
SITE_ROOT="/srv/civpro"

export DEBIAN_FRONTEND=noninteractive

# --- 0. Base packages (openssh-server is what deploy.ps1 pushes through)
apt-get update
apt-get install -y curl ca-certificates gnupg openssh-server

# --- 1. Caddy — official apt repo, per
#     https://caddyserver.com/docs/install (Debian/Ubuntu/Raspbian, stable),
#     accessed 2026-07-11. Two deltas from the doc's verbatim block: sudo
#     dropped (this script runs as root) and `apt` -> `apt-get -y`
#     (noninteractive; same packages, same repo).
if [[ ! -f /usr/share/keyrings/caddy-stable-archive-keyring.gpg ]]; then
  apt-get install -y debian-keyring debian-archive-keyring apt-transport-https
  curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/gpg.key' | gpg --dearmor -o /usr/share/keyrings/caddy-stable-archive-keyring.gpg
  curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/debian.deb.txt' | tee /etc/apt/sources.list.d/caddy-stable.list
  chmod o+r /usr/share/keyrings/caddy-stable-archive-keyring.gpg
  chmod o+r /etc/apt/sources.list.d/caddy-stable.list
  apt-get update
fi
apt-get install -y caddy
# The apt package installs a systemd service using /etc/caddy/Caddyfile
# (https://caddyserver.com/docs/running, accessed 2026-07-11).

# --- 2. cloudflared — official apt repo per https://pkg.cloudflare.com/index.html,
#     accessed 2026-07-11. Suite note: Debian 13 has NO "trixie" dist on this repo
#     (HTTP 404, checked 2026-07-11); the "any" suite is repo-verified live
#     (dists/any/Release = HTTP 200, current Packages index) though not described
#     in the page's prose — ⚠ repo-verified, doc-undocumented (research-notes.md §1.1).
if [[ ! -f /etc/apt/sources.list.d/cloudflared.list ]]; then
  curl -fsSL https://pkg.cloudflare.com/cloudflare-main.gpg | tee /usr/share/keyrings/cloudflare-main.gpg >/dev/null
  echo 'deb [signed-by=/usr/share/keyrings/cloudflare-main.gpg] https://pkg.cloudflare.com/cloudflared any main' | tee /etc/apt/sources.list.d/cloudflared.list
  apt-get update
fi
apt-get install -y cloudflared
# Binary only for now — the tunnel service is installed in Stage C
# (dashboard token, or 03-tunnel-setup.sh).

# --- 3. deploy user + SSH key slot for the push loop (deploy.ps1)
if ! id "$DEPLOY_USER" >/dev/null 2>&1; then
  useradd --create-home --shell /bin/bash "$DEPLOY_USER"
fi
install -d -m 700 -o "$DEPLOY_USER" -g "$DEPLOY_USER" "/home/${DEPLOY_USER}/.ssh"
AUTH_KEYS="/home/${DEPLOY_USER}/.ssh/authorized_keys"
if [[ ! -f "$AUTH_KEYS" ]]; then
  cat > "$AUTH_KEYS" <<'EOF'
# REPLACE-ME: paste the single-line contents of C:\Users\CJayB\.ssh\id_ed25519.pub
# (KOBAYASHI_MARU) below, then delete these comment lines.
EOF
  chmod 600 "$AUTH_KEYS"
  chown "$DEPLOY_USER":"$DEPLOY_USER" "$AUTH_KEYS"
fi

# --- 4. Site root + placeholder (deploy.ps1 swaps dist.new -> dist, keeps dist.prev)
install -d "$SITE_ROOT/dist"
if [[ ! -f "$SITE_ROOT/dist/index.html" ]]; then
  cat > "$SITE_ROOT/dist/index.html" <<'EOF'
<!doctype html><meta charset="utf-8"><title>CIVPRO Nexus preview</title>
<p>Provisioned. Awaiting first deploy (deploy.ps1).</p>
EOF
fi
chown -R "$DEPLOY_USER":"$DEPLOY_USER" "$SITE_ROOT"

# --- 5. Caddyfile install + reload.
#     Reload (not restart) after config edits per https://caddyserver.com/docs/running,
#     accessed 2026-07-11.
if [[ ! -f "$SCRIPT_DIR/Caddyfile" ]]; then
  echo "ERROR: $SCRIPT_DIR/Caddyfile not found — pct push it next to this script." >&2
  exit 1
fi
if [[ -f /etc/caddy/Caddyfile && ! -f /etc/caddy/Caddyfile.dist.bak ]]; then
  cp /etc/caddy/Caddyfile /etc/caddy/Caddyfile.dist.bak
fi
cp "$SCRIPT_DIR/Caddyfile" /etc/caddy/Caddyfile
# Validate before reload so a bad config can't take the site down. Verified:
# `caddy validate [-c, --config <path>]` loads/provisions the config without
# starting it — https://caddyserver.com/docs/command-line, accessed 2026-07-11.
caddy validate --config /etc/caddy/Caddyfile
systemctl enable --now caddy
systemctl reload caddy

# --- 6. Self-check: Caddy answers on loopback with the placeholder
sleep 1
HTTP_CODE="$(curl -s -o /dev/null -w '%{http_code}' http://127.0.0.1:8080/)"
if [[ "$HTTP_CODE" != "200" ]]; then
  echo "ERROR: expected HTTP 200 from http://127.0.0.1:8080/, got ${HTTP_CODE}." >&2
  echo "Inspect: systemctl status caddy ; journalctl -u caddy --no-pager | tail -50" >&2
  exit 1
fi
echo "OK: Caddy serving ${SITE_ROOT}/dist on 127.0.0.1:8080 (HTTP ${HTTP_CODE})."

cat <<'EOF'

Provisioning complete. NEXT STEPS:
  1. JAY-INTERACTIVE: paste your pubkey into /home/deploy/.ssh/authorized_keys
     (replace the REPLACE-ME lines; key lives at C:\Users\CJayB\.ssh\id_ed25519.pub).
  2. Tunnel — README-deploy.md Stage C:
       Option 1 (RECOMMENDED): dashboard-managed — create tunnel "civpro-preview"
         in the Cloudflare dashboard, then run the shown command here:
           cloudflared service install <TUNNEL_TOKEN>
       Option 2 (fallback): bash 03-tunnel-setup.sh
EOF
