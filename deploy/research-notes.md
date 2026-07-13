# Deploy research notes — CIVPRO Nexus preview site

**BLUF:** All four research areas verified against live official docs on 2026-07-11, with two exceptions flagged ⚠ at the bottom (Zero Trust free-plan seat count; Debian 13 "trixie" codename absent from the cloudflared apt repo — use the verified `any` suite instead). Recommendation: use the **dashboard-managed (remotely-managed) tunnel** — one token-based service install, no config.yml or credentials file on the LXC, hostname routing lives in the Cloudflare dashboard. The locally-managed workflow is captured below as the fallback.

Verification legend: ✅ = fetched from live official source this session (URL + access date cited). ⚠ UNVERIFIED = could not be confirmed from a live source; do not treat as fact.

---

## 1. cloudflared — Debian install + tunnel workflows

### 1.1 apt repo install ✅

Source: https://pkg.cloudflare.com/index.html — accessed 2026-07-11.

```bash
# Add Cloudflare GPG key
curl -fsSL https://pkg.cloudflare.com/cloudflare-main.gpg | sudo tee /usr/share/keyrings/cloudflare-main.gpg >/dev/null

# Add repo. Official page's example uses a codename suite ("bookworm main").
# Debian 13 note: the repo has NO "trixie" dist (HTTP 404 on
# https://pkg.cloudflare.com/cloudflared/dists/trixie/Release, checked 2026-07-11).
# It DOES serve an "any" suite — verified directly against the live repo 2026-07-11:
#   https://pkg.cloudflare.com/cloudflared/dists/any/Release returns HTTP 200,
#   Codename: any, Architectures: amd64 386 arm64 arm armhf, Components: main,
#   Packages index lists cloudflared 2026.7.1 (repo dated 2026-07-09).
# Use "any" on Debian 13:
echo 'deb [signed-by=/usr/share/keyrings/cloudflare-main.gpg] https://pkg.cloudflare.com/cloudflared any main' | sudo tee /etc/apt/sources.list.d/cloudflared.list

sudo apt-get update && sudo apt-get install cloudflared
```

(`bookworm main` also exists — HTTP 200 — if the LXC template ends up being Debian 12.)

### 1.2 Tunnel workflow — Option A: dashboard-managed (remotely-managed) — RECOMMENDED ✅

Sources: https://developers.cloudflare.com/cloudflare-one/networks/connectors/cloudflare-tunnel/get-started/create-remote-tunnel/ and https://developers.cloudflare.com/tunnel/setup/ — accessed 2026-07-11.

Steps (JAY-INTERACTIVE in the dashboard, then one command on the LXC):

1. Dashboard: **Networking > Tunnels** → **Create a tunnel** → name it (e.g. `civpro-preview`).
2. Dashboard shows an OS-specific connector install command. On Linux the documented form is:

```bash
sudo cloudflared service install <TUNNEL_TOKEN>
```

3. Dashboard: select the tunnel → **Routes** tab → **Add route** → **Published application** → subdomain `preview`, domain `civpronexus.org`, service URL `http://localhost:8080` (Caddy). Save — this also creates the DNS record.

Why recommended for this deploy: single static hostname; no config.yml, no credentials-file, no cert.pem on the LXC; routing changes happen in the dashboard without touching the box; the docs' primary "get started" path is this method (the config-file workflow now lives under "do-more-with-tunnels/local-management" — a structural signal, not an explicit doc statement; neither fetched page states an explicit recommendation).

Token retrieval later (e.g. rebuilding the LXC): **Networking > Tunnels** → select tunnel → **Add a replica** → copy the install command; the token is the `eyJ...` string. Source: https://developers.cloudflare.com/tunnel/advanced/tunnel-tokens/ — accessed 2026-07-11 (via search snippet; page confirms "a remotely-managed tunnel only requires a token to run").

### 1.3 Tunnel workflow — Option B: locally-managed (config.yml) — fallback ✅

Source: https://developers.cloudflare.com/cloudflare-one/connections/connect-networks/get-started/create-local-tunnel/ (current canonical: https://developers.cloudflare.com/cloudflare-one/networks/connectors/cloudflare-tunnel/do-more-with-tunnels/local-management/create-local-tunnel/) — accessed 2026-07-11.

```bash
# 1. Authenticate (JAY-INTERACTIVE: opens a browser URL to pick the zone)
cloudflared tunnel login

# 2. Create the named tunnel (writes <UUID>.json credentials file)
cloudflared tunnel create civpro-preview

# 3. Config file at ~/.cloudflared/config.yml — documented published-application format:
#      url: http://localhost:8000
#      tunnel: <Tunnel-UUID>
#      credentials-file: /root/.cloudflared/<Tunnel-UUID>.json
#    For this deploy, url: http://127.0.0.1:8080 (kit convention — addendum item 4)
#    (Multi-hostname deployments use an `ingress:` list with a final
#     `- service: http_status:404` catch-all; single-hostname works with the
#     flat `url:` form shown in the doc.)

# 4. Route DNS
cloudflared tunnel route dns civpro-preview preview.civpronexus.org

# 5. Test run
cloudflared tunnel run civpro-preview

# 6. Verify
cloudflared tunnel info civpro-preview
```

Run as systemd service — source: https://developers.cloudflare.com/cloudflare-one/connections/connect-networks/configure-tunnels/local-management/as-a-service/linux/ — accessed 2026-07-11:

```bash
sudo cloudflared service install
# Doc warning: under sudo, $HOME is /root, so config.yml created in a user home
# won't be found. If needed:
sudo cloudflared --config /home/<USER>/.cloudflared/config.yml service install

systemctl start cloudflared
systemctl status cloudflared
systemctl restart cloudflared   # after config changes
```

config.yml must include `tunnel:` (UUID) and `credentials-file:`.

---

## 2. Caddy — Debian install + localhost-HTTP static Caddyfile

### 2.1 apt install ✅

Source: https://caddyserver.com/docs/install (Debian/Ubuntu/Raspbian, stable) — accessed 2026-07-11. Verbatim:

```bash
sudo apt install -y debian-keyring debian-archive-keyring apt-transport-https curl
curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/gpg.key' | sudo gpg --dearmor -o /usr/share/keyrings/caddy-stable-archive-keyring.gpg
curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/debian.deb.txt' | sudo tee /etc/apt/sources.list.d/caddy-stable.list
sudo chmod o+r /usr/share/keyrings/caddy-stable-archive-keyring.gpg
sudo chmod o+r /etc/apt/sources.list.d/caddy-stable.list
sudo apt update
sudo apt install caddy
```

The apt package installs a systemd service using `/etc/caddy/Caddyfile`. Service management (source: https://caddyserver.com/docs/running — accessed 2026-07-11):

```bash
systemctl status caddy
sudo systemctl reload caddy    # after editing Caddyfile — doc: do NOT stop/restart to apply config; reload avoids downtime
journalctl -u caddy --no-pager | less +G
```

### 2.2 Disabling automatic HTTPS the right way ✅

Source: https://caddyserver.com/docs/automatic-https — accessed 2026-07-11. Automatic HTTPS activates when Caddy knows a domain/IP from site addresses; it is disabled per-site by "Prefixing the site address with `http://`" (or globally with `auto_https off`). So the site address `http://127.0.0.1:8080` serves plain HTTP, bound to loopback only — exactly what the tunnel needs. No global option required.

### 2.3 Minimal Caddyfile ✅ (assembled from verified directive syntax)

Sources — all accessed 2026-07-11:
- static file server pattern (`root` + `file_server`): https://caddyserver.com/docs/caddyfile/patterns
- `encode zstd gzip` (documented default ordering, Zstandard preferred): https://caddyserver.com/docs/caddyfile/directives/encode
- `header { ... }` multi-header block form: https://caddyserver.com/docs/caddyfile/directives/header

```caddyfile
# /etc/caddy/Caddyfile
http://127.0.0.1:8080 {
	root * /srv/civpro/dist
	encode zstd gzip
	header {
		X-Content-Type-Options nosniff
		X-Frame-Options DENY
		Referrer-Policy no-referrer-when-downgrade
	}
	file_server
}
```

Notes: the docs' bare pattern is `root /var/www` — the `*` matcher form (`root * /srv/civpro/dist`) is the docs' SPA-pattern form and is safe here. No HSTS header: TLS terminates at Cloudflare, and Caddy speaks plain HTTP, so `Strict-Transport-Security` should come from Cloudflare if desired. Single `index.html` site — no `try_files`/rewrite needed.

---

## 3. Proxmox — template download + unprivileged LXC creation ✅

Sources: https://pve.proxmox.com/wiki/Linux_Container and https://pve.proxmox.com/pve-docs/pct.1.html — accessed 2026-07-11.

### 3.1 Template via pveam

```bash
pveam update
pveam available --section system          # list; grep for debian-13 (exact filename node-dependent)
pveam download local <TEMPLATE_FILENAME>  # doc example: pveam download local debian-10.0-standard_10.0-1_amd64.tar.gz
pveam list local                          # confirm
```

⚠ The exact Debian 13 template filename (e.g. `debian-13-standard_13.x-x_amd64.tar.zst`) must be read from `pveam available` on the node — do not hardcode.

### 3.2 pct create — verified flags

Syntax: `pct create <vmid> <ostemplate> [OPTIONS]`. Verified against the pct(1) man page:
- `--unprivileged <boolean>` (default 0) — "Makes the container run as unprivileged user."
- `--rootfs [volume=]<volume>[,size=<DiskSize>]` — supports `STORAGE_ID:SIZE_IN_GiB` shorthand.
- `--net0 name=<string>[,bridge=<bridge>][,ip=<IPv4/CIDR|dhcp|manual>][,gw=<GatewayIPv4>][,tag=<integer>]`
- `--onboot <boolean>` (default 0)
- `--features [nesting=<1|0>]` — wiki: nesting "expose[s] procfs and sysfs to allow nested containers. Note that systemd also uses this to isolate services." → set `nesting=1` for a Debian/systemd guest.
- `--hostname <string>`, `--memory <integer>` (MB, default 512), `--cores <integer>`, `--password <password>`, `--ssh-public-keys <filepath>`, `--ostype debian`, `--start <boolean>`.

Parameterized example (values are deploy-kit parameters, not doc-verified):

```bash
pct create <VMID> local:vztmpl/<TEMPLATE_FILENAME> \
  --hostname civpro-web \
  --unprivileged 1 \
  --ostype debian \
  --cores 1 --memory 512 \
  --rootfs <STORAGE_POOL>:4 \
  --net0 name=eth0,bridge=vmbr0,ip=dhcp \
  --features nesting=1 \
  --onboot 1 \
  --ssh-public-keys <PUBKEY_FILE> \
  --start 1
# Static IP variant: ip=<IPv4/CIDR>,gw=<GatewayIPv4>; VLAN: append ,tag=<VLAN_ID> to --net0
```

---

## 4. Cloudflare Access — self-hosted app + email OTP

### 4.1 One-time PIN identity provider ✅

Source: https://developers.cloudflare.com/cloudflare-one/identity/one-time-pin/ — accessed 2026-07-11.

JAY-INTERACTIVE: **Zero Trust > Integrations > Identity providers** → **Add new identity provider** → **One-time PIN**. Users: enter email → **Send login code** → PIN emailed (expires 10 min, single-use; requesting a new code invalidates the previous). Email is only sent if an Access policy allows that address. If mail scanning is in play, allowlist `noreply@notify.cloudflare.com`.

### 4.2 Self-hosted application ✅

Source: https://developers.cloudflare.com/cloudflare-one/applications/configure-apps/self-hosted-public-app/ — accessed 2026-07-11.

Prerequisite: domain active on Cloudflare. JAY-INTERACTIVE steps:

1. **Zero Trust > Access controls > Applications** → **Create new application** → **Self-hosted and private** → **Add public hostname**.
2. Hostname: subdomain `preview`, domain `civpronexus.org` (dropdown).
3. Attach a policy — doc: "All Access applications are deny by default — a user must match an Allow policy before they are granted access." Create an **Allow** policy with an include rule listing the ≤3 authorized emails.
4. Identity providers: enable **One-time PIN** (deselect others if any).
5. Set **Session Duration**, then **Create**.

Post-setup per docs: origin reachable via Cloudflare Tunnel (section 1); optionally validate the Access JWT at origin (skippable for this preview — tunnel-only origin, no direct exposure).

### 4.3 Plan coverage

- A Zero Trust **Free** plan exists and includes Access app policies (account-limits page enumerates "Zero Trust Free" as a tier; setup flow requires payment details but does not charge — https://developers.cloudflare.com/cloudflare-one/setup/ and https://developers.cloudflare.com/cloudflare-one/account-limits/, accessed 2026-07-11).
- ⚠ UNVERIFIED: the exact free-plan **seat count** (commonly cited as 50 users). Not stated on any developers.cloudflare.com page fetched this session (account-limits, seat-management, getting-started FAQ all silent); www.cloudflare.com/plans/zero-trust-services/ did not render the comparison table. Confirm the seat number in the plan-selection screen during Zero Trust onboarding. For ≤3 users this is not a practical risk.

---

## ⚠ UNVERIFIED — summary

1. **Zero Trust free-plan seat limit** ("50 users") — confirm at plan-selection during onboarding (§4.3).
2. **Debian 13 LXC template filename** — read from `pveam available --section system` on the node (§3.1).
3. **`any` apt suite for cloudflared** — verified against the live repo metadata (HTTP 200, current Packages index) but not described in pkg.cloudflare.com's prose, which shows codename suites like `bookworm`. Treat as repo-verified, doc-undocumented (§1.1).
4. **Dashboard-vs-local recommendation** — no fetched Cloudflare page states an explicit recommendation; "dashboard-managed as primary path" is inferred from docs information architecture (get-started vs do-more-with-tunnels). The recommendation in §1.2 is ours, on operational grounds (§1.2).

---

## Addendum — adversarial review verifications (2026-07-11)

New verifications performed during the deploy-kit adversarial review; each ✅ was fetched live this session.

1. ✅ **`caddy validate --config <path>`** exists and "loads and provisions all of its modules as if to start the config, but the config is not actually started" — https://caddyserver.com/docs/command-line, accessed 2026-07-11. (Was ⚠ in 02-provision.sh; now verified.)
2. ✅ **`pct exec` / `pct push` / `pct enter` / `pct status` / `pct stop` / `pct destroy`** all documented — https://pve.proxmox.com/pve-docs/pct.1.html, accessed 2026-07-11. (Was ⚠ open item 5 in the README; resolved.)
3. ✅ **DNS records and tunnels are independent** — "If a tunnel stops, the DNS record is not deleted — visitors will see a `1016` error"; records pointing at deleted/stopped tunnels must be cleaned up in the zone's DNS tab — https://developers.cloudflare.com/cloudflare-one/networks/connectors/cloudflare-tunnel/routing-to-tunnel/dns/, accessed 2026-07-11. **This corrected a false rollback claim** in README Stage C ("DNS route is removed with the tunnel") and added a re-run caveat to 03-tunnel-setup.sh step 5.
4. **Kit convention:** the dashboard published-application service URL is standardized to `http://127.0.0.1:8080` (the §1.2 doc example shows `localhost:8080`; Caddy binds `127.0.0.1` specifically, so `127.0.0.1` avoids `localhost`→`::1` resolution ambiguity and matches the Caddyfile, 02-provision.sh self-check, 03-tunnel-setup.sh, and deploy.ps1).
5. **Line-ending guard:** this repo checkout has `core.autocrlf=true` and no `.gitattributes`; `deploy/.gitattributes` now pins `*.sh` and `Caddyfile` to `eol=lf` so a fresh Windows checkout cannot CRLF-corrupt files destined for bash.
6. ⚠ NEW UNVERIFIED: whether a Cloudflare Access self-hosted app can be **saved before** the tunnel route/DNS record exists (README Stage C public-window note suggests doing Access first). No fetched doc states it either way; fallback is creating route + Access app back-to-back.
