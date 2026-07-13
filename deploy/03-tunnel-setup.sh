#!/usr/bin/env bash
# 03-tunnel-setup.sh — LOCALLY-MANAGED (config-file) Cloudflare Tunnel. FALLBACK ONLY.
# RECOMMENDED path is the dashboard-managed tunnel (README-deploy.md Stage C
# Option 1): one `cloudflared service install <TOKEN>` command, no config.yml,
# no credentials file on this box. Use this script only if you want tunnel
# config to live on the LXC instead of the dashboard.
#
# Run INSIDE the LXC as root, after 02-provision.sh.
# Workflow verified against, accessed 2026-07-11:
# - https://developers.cloudflare.com/cloudflare-one/connections/connect-networks/get-started/create-local-tunnel/
# - https://developers.cloudflare.com/cloudflare-one/connections/connect-networks/configure-tunnels/local-management/as-a-service/linux/
set -euo pipefail

# ------------------------- parameters (env-overridable) -----------------------
TUNNEL_NAME="${TUNNEL_NAME:-civpro-preview}"
PUBLIC_HOSTNAME="${PUBLIC_HOSTNAME:-preview.civpronexus.org}"
SERVICE_URL="${SERVICE_URL:-http://127.0.0.1:8080}"
CFD_DIR="/root/.cloudflared"   # running as root => $HOME=/root, where
                               # `cloudflared service install` looks for config.yml
                               # (doc warning about sudo/$HOME mismatch, accessed 2026-07-11)
# ------------------------------------------------------------------------------

# --- 1. Authenticate. JAY-INTERACTIVE: this prints a URL — open it in the
#     browser on KOBAYASHI_MARU, log in to Cloudflare, pick the civpronexus.org
#     zone. Writes cert.pem.
if [[ ! -f "$CFD_DIR/cert.pem" ]]; then
  echo ">>> JAY-INTERACTIVE: a login URL will print below. Open it in your browser,"
  echo ">>> authenticate, and select the civpronexus.org zone. Waiting..."
  cloudflared tunnel login
else
  echo "cert.pem present — already authenticated."
fi

# --- 2. Create the named tunnel (writes <UUID>.json credentials file)
if compgen -G "$CFD_DIR/*.json" >/dev/null; then
  echo "A tunnel credentials file already exists in $CFD_DIR — skipping create."
  echo "(To start over: cloudflared tunnel delete $TUNNEL_NAME, remove the .json, re-run.)"
else
  cloudflared tunnel create "$TUNNEL_NAME"
fi

# --- 3. Resolve UUID from the credentials filename.
#     ⚠ assumes exactly one tunnel on this box; if several .json files exist,
#     set CRED_FILE manually before the config write.
CRED_FILE="$(ls -t "$CFD_DIR"/*.json | head -n1)"
TUNNEL_UUID="$(basename "$CRED_FILE" .json)"
echo "Tunnel UUID: $TUNNEL_UUID"

# --- 4. config.yml — documented keys: tunnel (UUID), credentials-file, and an
#     ingress list with a final http_status:404 catch-all (research-notes.md §1.3).
if [[ -f "$CFD_DIR/config.yml" ]]; then
  cp "$CFD_DIR/config.yml" "$CFD_DIR/config.yml.bak"
fi
cat > "$CFD_DIR/config.yml" <<EOF
tunnel: ${TUNNEL_UUID}
credentials-file: ${CRED_FILE}
ingress:
  - hostname: ${PUBLIC_HOSTNAME}
    service: ${SERVICE_URL}
  - service: http_status:404
EOF
echo "Wrote $CFD_DIR/config.yml"

# --- 5. Route DNS (creates the CNAME for the hostname on the zone).
#     ⚠ NOT idempotent: DNS records and tunnels are independent — deleting or
#     recreating a tunnel does NOT touch the record
#     (https://developers.cloudflare.com/cloudflare-one/networks/connectors/cloudflare-tunnel/routing-to-tunnel/dns/,
#     accessed 2026-07-11) — so a re-run fails here if the CNAME already exists.
#     Re-running after a partial setup: delete the preview CNAME in the zone's
#     DNS tab first, or skip this step if the record already points at this tunnel.
cloudflared tunnel route dns "$TUNNEL_NAME" "$PUBLIC_HOSTNAME"

# --- 6. Install + start the systemd service. Running as root, so config.yml in
#     /root/.cloudflared is found without the --config override the docs warn about.
#     Unit-exists check: `systemctl cat` exits non-zero when the unit doesn't
#     exist. (Previous check used is-enabled, which also fails for an
#     installed-but-disabled unit — that would wrongly re-run
#     `cloudflared service install` and abort under set -e.)
if systemctl cat cloudflared.service >/dev/null 2>&1; then
  echo "cloudflared service already installed — restarting to pick up config."
  systemctl restart cloudflared
else
  cloudflared service install
  systemctl start cloudflared
fi

# --- 7. Verify
systemctl --no-pager status cloudflared || true
cloudflared tunnel info "$TUNNEL_NAME"

cat <<EOF

Tunnel up. NEXT STEP (README-deploy.md Stage D, JAY-INTERACTIVE):
  Cloudflare Access gate — Zero Trust dashboard:
    Integrations > Identity providers > One-time PIN, then
    Access controls > Applications > Self-hosted app on ${PUBLIC_HOSTNAME}
    with an Allow policy listing the authorized emails.
  NOTE: until that Access app exists, https://${PUBLIC_HOSTNAME} is PUBLIC.
Then deploy from KOBAYASHI_MARU: deploy.ps1 -LxcHost <LXC_IP>
EOF
