# CIVPRO Nexus preview site — deploy runbook

**BLUF:** Static Vite build (~350KB) served by Caddy inside an unprivileged Debian LXC on the home Proxmox node, published as `https://preview.civpronexus.org` through a Cloudflare Tunnel (zero inbound ports, home IP never exposed), gated by Cloudflare Access email OTP for ≤3 users. Deploys are one PowerShell command from KOBAYASHI_MARU. Recommended tunnel mode: **dashboard-managed** (one token command on the LXC, routing lives in the Cloudflare dashboard); `03-tunnel-setup.sh` is the config-file fallback.

All commands were verified against live official docs on 2026-07-11 (see `research-notes.md`). Anything that could not be verified is flagged **⚠ UNVERIFIED** inline.

## Kit contents

| File | Runs on | Purpose |
|---|---|---|
| `01-create-lxc.sh` | Proxmox node shell | Fetch Debian 13 template, `pct create` the container |
| `02-provision.sh` | Inside the LXC (root) | Install Caddy + cloudflared, create `deploy` user, install `Caddyfile` |
| `Caddyfile` | Copied to `/etc/caddy/Caddyfile` | Loopback-only HTTP server for `/srv/civpro/dist` |
| `03-tunnel-setup.sh` | Inside the LXC (root) | **Fallback only** — locally-managed tunnel via `config.yml` |
| `deploy.ps1` | KOBAYASHI_MARU (pwsh 7) | Build → push → atomic swap → verify |
| `.gitattributes` | (repo housekeeping) | Pins LF endings on the `.sh` files + `Caddyfile` against `core.autocrlf=true` |

Stage markers: **JAY-INTERACTIVE** = needs Jay's browser/Cloudflare login; everything else is copy-paste shell.

---

## Prerequisites checklist

- [ ] Proxmox node reachable (SSH or console). Node details are parameterized in `01-create-lxc.sh` — you will need: free **VMID** (default 210), **storage pool** name for the rootfs, **bridge** (default `vmbr0`), optional **VLAN tag**, and whether the LXC gets DHCP or a static IP.
- [ ] **JAY-INTERACTIVE:** `civpronexus.org` registered at Cloudflare Registrar and active in the Cloudflare account. (NOT yet registered as of 2026-07-11 — verified via RDAP. Register first; the Access self-hosted app requires the domain active on Cloudflare: <https://developers.cloudflare.com/cloudflare-one/applications/configure-apps/self-hosted-public-app/>, accessed 2026-07-11.)
- [ ] **JAY-INTERACTIVE:** Zero Trust onboarding completed once (pick the **Free** plan — the setup flow requires payment details but does not charge: <https://developers.cloudflare.com/cloudflare-one/setup/>, accessed 2026-07-11). ⚠ UNVERIFIED: exact free-plan seat count (commonly cited as 50) — confirm on the plan-selection screen; irrelevant at ≤3 users.
- [ ] SSH keypair exists on KOBAYASHI_MARU: `C:\Users\CJayB\.ssh\id_ed25519.pub` (its contents get pasted into the `deploy` user's `authorized_keys` in Stage B).
- [ ] The three `.sh` files and `Caddyfile` keep **LF line endings** when copied (bash chokes on CRLF — this includes `01-create-lxc.sh`, which runs under bash on the node). `deploy/.gitattributes` pins `eol=lf` on them; without it, this repo's `core.autocrlf=true` would rewrite them to CRLF on a fresh Windows checkout. Belt-and-suspenders check from pwsh in `deploy\`: ``(Get-Content .\02-provision.sh -Raw) -match "`r"`` must return `False`.

---

## Stage A — create the LXC (Proxmox node shell)

Copy the kit to the node — Stage B pushes two of these files into the LXC *from the node shell*, so all three must land on the node:

```powershell
scp .\deploy\01-create-lxc.sh .\deploy\02-provision.sh .\deploy\Caddyfile root@<NODE_IP>:
```

Then on the node run:

```bash
VMID=210 STORAGE=local-lvm bash 01-create-lxc.sh
# All params: VMID STORAGE TEMPLATE_STORAGE BRIDGE VLAN_TAG IP GATEWAY HOSTNAME MEMORY_MB CORES DISK_GB PUBKEY_FILE
# Static-IP example:
#   VMID=210 STORAGE=local-lvm IP=192.168.20.50/24 GATEWAY=192.168.20.1 VLAN_TAG=20 bash 01-create-lxc.sh
```

The script does `pveam update` → auto-detects the newest `debian-13-standard` template (⚠ exact filename is node-dependent; override with `TEMPLATE=` if auto-detect fails) → `pveam download` → `pct create --unprivileged 1 --features nesting=1` (nesting needed for systemd guests) → `pct start`. Verified against <https://pve.proxmox.com/wiki/Linux_Container> and the pct(1) man page, accessed 2026-07-11.

**Verify:** `pct status <VMID>` shows `running`; `pct exec <VMID> -- ip -4 addr show eth0` shows the IP (note it — it is `deploy.ps1`'s `-LxcHost`). (`pct exec`, `pct push`, `pct enter`, `pct status`, `pct stop`, `pct destroy` all verified against <https://pve.proxmox.com/pve-docs/pct.1.html>, accessed 2026-07-11.)

**Rollback:** `pct stop <VMID> && pct destroy <VMID>` — the container is disposable until Stage C binds a tunnel to it.

## Stage B — provision (inside the LXC)

Push the script and Caddyfile from the Proxmox shell, then run:

```bash
pct push <VMID> 02-provision.sh /root/02-provision.sh
pct push <VMID> Caddyfile /root/Caddyfile
pct exec <VMID> -- bash /root/02-provision.sh
```

What it does (each block carries its doc-URL comment):
- Caddy via the official Cloudsmith apt repo (<https://caddyserver.com/docs/install>, accessed 2026-07-11); the package runs Caddy as a systemd service off `/etc/caddy/Caddyfile`.
- cloudflared via `pkg.cloudflare.com` using the **`any`** apt suite — ⚠ repo-verified but doc-undocumented: the repo serves no `trixie` dist for Debian 13 (HTTP 404, checked 2026-07-11) but `dists/any/Release` returns HTTP 200 with a current Packages index. Binary install only; the tunnel service is configured in Stage C.
- Creates `deploy` user, `/srv/civpro/dist` placeholder, installs the Caddyfile, reloads Caddy.

**JAY-INTERACTIVE (30 seconds):** put your pubkey in place — on the LXC edit `/home/deploy/.ssh/authorized_keys` and replace the `REPLACE-ME` line with the contents of `C:\Users\CJayB\.ssh\id_ed25519.pub`.

**Verify:** the script self-checks with `curl -s -o /dev/null -w '%{http_code}' http://127.0.0.1:8080/` → `200` (placeholder page). Then from KOBAYASHI_MARU: `ssh deploy@<LXC_IP> true` succeeds.

**Rollback:** the script is idempotent — rerun it; or destroy/recreate the LXC (Stage A rollback).

## Stage C — tunnel + DNS

### Option 1 — dashboard-managed tunnel (RECOMMENDED)

Sources: <https://developers.cloudflare.com/cloudflare-one/networks/connectors/cloudflare-tunnel/get-started/create-remote-tunnel/> and <https://developers.cloudflare.com/tunnel/setup/>, accessed 2026-07-11. Why: no `config.yml`, no credentials file, no `cert.pem` on the LXC; routing changes happen in the dashboard without touching the box. (⚠ note: "dashboard as primary path" is our operational recommendation inferred from the docs' structure — no fetched page states it explicitly.)

1. **JAY-INTERACTIVE:** Cloudflare dashboard → **Networking > Tunnels** → **Create a tunnel** → name it `civpro-preview`. The dashboard shows the Linux connector install command.
2. On the LXC (root):

   ```bash
   cloudflared service install <TUNNEL_TOKEN>   # token = the eyJ... string from the dashboard
   ```

3. **JAY-INTERACTIVE:** select the tunnel → **Routes** tab → **Add route** → **Published application** → subdomain `preview`, domain `civpronexus.org`, service URL `http://127.0.0.1:8080`. (The doc's example uses `localhost:8080`; use `127.0.0.1` — Caddy binds `127.0.0.1` specifically, so this sidesteps any `localhost`→`::1` resolution ambiguity and matches every other file in this kit.) Saving also creates the DNS record.

> **Public-window note:** the hostname is publicly reachable from the moment step 3 saves until Stage D's Access app exists. To avoid even that window, do Stage D **first**, or immediately after. ⚠ UNVERIFIED: whether the dashboard lets you save the Access app before the DNS route/record exists — no fetched doc states it either way. If it refuses the hostname pre-route, do step 3 and Stage D back-to-back.

Token retrieval later (e.g. rebuilding the LXC): tunnel → **Add a replica** → copy the install command (<https://developers.cloudflare.com/tunnel/advanced/tunnel-tokens/>, accessed 2026-07-11).

### Option 2 — locally-managed tunnel (fallback: `03-tunnel-setup.sh`)

Run on the LXC as root. It walks the verified local workflow (<https://developers.cloudflare.com/cloudflare-one/connections/connect-networks/get-started/create-local-tunnel/>, accessed 2026-07-11): `cloudflared tunnel login` (**JAY-INTERACTIVE** — prints a URL to open in your browser), `tunnel create civpro-preview`, writes `/root/.cloudflared/config.yml` with an `ingress:` list (`preview.civpronexus.org → http://127.0.0.1:8080`, catch-all `http_status:404`), `tunnel route dns`, `cloudflared service install`, `systemctl start cloudflared`.

**Verify (either option):** on the LXC `systemctl status cloudflared` is `active (running)`; Option 2 also: `cloudflared tunnel info civpro-preview`. Dashboard shows the tunnel **HEALTHY**.

**Rollback:** dashboard → tunnel → delete (Option 1), or `cloudflared tunnel delete civpro-preview` after `systemctl stop cloudflared` (Option 2). The DNS record is **not** removed with the tunnel — DNS records and tunnels are independent ("If a tunnel stops, the DNS record is not deleted — visitors will see a `1016` error": <https://developers.cloudflare.com/cloudflare-one/networks/connectors/cloudflare-tunnel/routing-to-tunnel/dns/>, accessed 2026-07-11). Also delete the `preview` CNAME in the zone's DNS tab, or recreating the route later fails with a "record already exists" error.

## Stage D — Access gate (JAY-INTERACTIVE)

Sources: <https://developers.cloudflare.com/cloudflare-one/identity/one-time-pin/> and <https://developers.cloudflare.com/cloudflare-one/applications/configure-apps/self-hosted-public-app/>, both accessed 2026-07-11.

1. **Zero Trust > Integrations > Identity providers** → **Add new identity provider** → **One-time PIN**. (PINs expire in 10 min, single-use; a new request invalidates the previous. If a recipient's mail is filtered, allowlist `noreply@notify.cloudflare.com`.)
2. **Zero Trust > Access controls > Applications** → **Create new application** → **Self-hosted and private** → **Add public hostname** → subdomain `preview`, domain `civpronexus.org`.
3. Attach an **Allow** policy whose include rule lists the ≤3 authorized emails. (Docs: Access apps are deny-by-default — no matching Allow policy, no access. This is also why OTP emails only go to allowed addresses.)
4. Identity providers: enable **One-time PIN** only. Set **Session Duration**. **Create**.

JWT validation at origin is skippable here: the origin is loopback-only behind the tunnel, with no direct exposure.

**Verify:** see Stage F. **Rollback:** delete the application — the site becomes public (see "Going public" below). If an ungated public site is not acceptable while the route stays up, delete the tunnel route (or the tunnel) as well.

## Stage E — first deploy from Windows

On KOBAYASHI_MARU (pwsh 7):

```powershell
cd "C:\Users\CJayB\dev\chmr\Airwars\CIVPRO Nexus\08-website"
.\deploy\deploy.ps1 -LxcHost <LXC_IP>          # scp -r (default)
.\deploy\deploy.ps1 -LxcHost <LXC_IP> -UseTar  # tar-over-ssh variant (fewer round-trips, faster on many small files)
```

The script runs `npm run build`, pushes `dist/` to `/srv/civpro/dist.new`, swaps (`dist` → `dist.prev`, `dist.new` → `dist`), and curl-verifies `http://127.0.0.1:8080/` through SSH.

**Verify:** script prints `HTTP 200` and the public URL. **Rollback:** Stage G.

## Stage F — verify end-to-end

From KOBAYASHI_MARU:

```powershell
# 1. Origin serves the real build (through SSH, bypassing Cloudflare):
ssh deploy@<LXC_IP> "curl -s http://127.0.0.1:8080/ | head -c 300"

# 2. Access challenge appears (expect a 302 toward your <team>.cloudflareaccess.com login, NOT site content):
curl.exe -sS -o NUL -D - https://preview.civpronexus.org/
```

3. Browser check: open `https://preview.civpronexus.org` → Access login page → enter an **allowed** email → PIN arrives → site renders.
4. Negative check: request a PIN for a non-allowed email → no code is delivered (doc-verified behavior: email is only sent if a policy allows that address).
5. Collaborator check: have one of the ≤3 users repeat step 3 from their own machine.

If step 2 returns site content with no challenge, the Access app hostname doesn't match — recheck Stage D step 2.

## Stage G — update loop + rollback

**Update:** edit site → `.\deploy\deploy.ps1 -LxcHost <LXC_IP>`. Each run keeps exactly one previous build at `/srv/civpro/dist.prev`.

**Rollback (single mv, plus restoring the swap invariant):**

```powershell
ssh deploy@<LXC_IP> "cd /srv/civpro && mv dist dist.broken && mv dist.prev dist"
# inspect dist.broken at leisure; rm -rf it when done
```

No service restart needed — Caddy serves whatever is at `/srv/civpro/dist`. Cache safety: `index.html` is served `no-cache` and hashed assets under `/assets/` are `immutable`, so a swap is picked up on the next page load.

---

## Going public later (removing the Access gate)

When the preview is ready for the world, the tunnel/Caddy stack is already production-shaped; only the gate changes:

1. **JAY-INTERACTIVE:** Zero Trust → **Access controls > Applications** → the `preview.civpronexus.org` app → **Delete** (or edit the policy if you want to keep a gate with wider membership). Access apps are deny-by-default *only for requests that hit an app* — with no app on the hostname, requests flow straight through the tunnel to Caddy.
2. Nothing changes on the LXC or in DNS.
3. Optional at the same time: add the real public hostname (e.g. `www.civpronexus.org`) as a second published-application route on the same tunnel (dashboard, Stage C step 3) — Caddy serves the same dist either way.
4. Re-run Stage F step 2: the curl should now return `200` with site content instead of the Access 302.

To re-gate, recreate the Access app (Stage D) — a few minutes of dashboard work.

## Ops note — home-hosted availability

This site is up exactly when the Proxmox node is up: a power cut, ISP outage, or node reboot takes the preview down until the box returns (the LXC is `--onboot 1`, and both caddy and cloudflared are systemd-enabled, so recovery after power-on is automatic — no manual steps). A UPS on the node rides through short outages and prevents unclean shutdowns; Wake-on-LAN is of limited use here because there is no path to send the magic packet when the tunnel — which depends on the node itself — is down. If a collaborator hits a dead link, the fix is "check the node," and for a ≤3-user preview that trade is fine; if uptime ever matters more, the same dist can be pushed to any static host and the tunnel decommissioned.

---

## ⚠ Open items (carried from research-notes.md)

1. Zero Trust free-plan seat count — confirm at plan selection; no practical risk at ≤3 users.
2. Debian 13 template filename — read from `pveam available --section system` on the node.
3. cloudflared `any` apt suite — verified against live repo metadata, not described in official prose.
4. Dashboard-vs-local tunnel recommendation — ours, on operational grounds; not an explicit doc statement.
5. Caddyfile per-path `Cache-Control` matchers — the `header` directive doc (cited in the Caddyfile) covers matcher usage, but the exact named-matcher lines were not captured verbatim in research. `caddy validate` itself is now doc-verified (<https://caddyserver.com/docs/command-line>, accessed 2026-07-11) and `02-provision.sh` runs it before reloading, so a bad matcher cannot take the site down.
6. Access app creation *before* the DNS route exists (Stage C public-window note) — dashboard behavior not stated in any fetched doc.

Resolved during adversarial review (2026-07-11): `pct exec`/`pct push`/`pct enter`/`pct status`/`pct stop`/`pct destroy` verified against <https://pve.proxmox.com/pve-docs/pct.1.html>; `caddy validate --config` verified against <https://caddyserver.com/docs/command-line>; tunnel-delete-does-NOT-delete-DNS verified against the Cloudflare DNS-routing doc (Stage C rollback corrected accordingly). See research-notes.md addendum.
