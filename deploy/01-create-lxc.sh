#!/usr/bin/env bash
# 01-create-lxc.sh — create the civpro-web LXC. Run on the Proxmox NODE shell as root.
# Next: 02-provision.sh (see README-deploy.md Stage B).
#
# Commands verified against https://pve.proxmox.com/wiki/Linux_Container and
# https://pve.proxmox.com/pve-docs/pct.1.html — accessed 2026-07-11.
set -euo pipefail

# ------------------------- parameters (env-overridable) -----------------------
VMID="${VMID:-210}"                       # must be a free VMID on this node
STORAGE="${STORAGE:-local-lvm}"           # storage pool for the container rootfs
TEMPLATE_STORAGE="${TEMPLATE_STORAGE:-local}"  # storage that holds vztmpl templates
BRIDGE="${BRIDGE:-vmbr0}"
VLAN_TAG="${VLAN_TAG:-}"                  # optional, e.g. 20 — empty = untagged
IP="${IP:-dhcp}"                          # "dhcp" or CIDR e.g. 192.168.20.50/24
GATEWAY="${GATEWAY:-}"                    # required when IP is static CIDR
HOSTNAME_LXC="${HOSTNAME_LXC:-civpro-web}"
MEMORY_MB="${MEMORY_MB:-512}"
CORES="${CORES:-1}"
DISK_GB="${DISK_GB:-4}"
PUBKEY_FILE="${PUBKEY_FILE:-}"            # optional: root authorized_keys for the LXC
TEMPLATE="${TEMPLATE:-}"                  # optional explicit template filename; auto-detected if empty
# ------------------------------------------------------------------------------

if [[ "$IP" != "dhcp" && -z "$GATEWAY" ]]; then
  echo "ERROR: static IP ($IP) requires GATEWAY=<IPv4>." >&2
  exit 1
fi

# --- 1. Template. Verified: pveam update / available / download / list
#     (https://pve.proxmox.com/wiki/Linux_Container, accessed 2026-07-11).
pveam update

if [[ -z "$TEMPLATE" ]]; then
  # ⚠ UNVERIFIED parsing: assumes "pveam available" prints "<section> <filename>"
  # two-column lines. The Debian 13 template filename is node-dependent and must
  # NOT be hardcoded (research-notes.md §3.1). If this auto-detect fails, run
  #   pveam available --section system
  # and re-run with TEMPLATE=<exact filename>.
  TEMPLATE="$(pveam available --section system | awk '{print $2}' | grep -E '^debian-13-standard' | sort -V | tail -n1 || true)"
fi

if [[ -z "$TEMPLATE" ]]; then
  echo "ERROR: no debian-13-standard template found via 'pveam available --section system'." >&2
  echo "List templates manually and re-run with TEMPLATE=<filename>." >&2
  exit 1
fi
echo "Using template: $TEMPLATE"

if pveam list "$TEMPLATE_STORAGE" | grep -q "vztmpl/${TEMPLATE}"; then
  echo "Template already downloaded on ${TEMPLATE_STORAGE}."
else
  pveam download "$TEMPLATE_STORAGE" "$TEMPLATE"
fi

# --- 2. Build --net0 value. Verified flag syntax:
#     name=<string>[,bridge=<bridge>][,ip=<IPv4/CIDR|dhcp|manual>][,gw=<GatewayIPv4>][,tag=<integer>]
#     (pct(1) man page, accessed 2026-07-11).
NET0="name=eth0,bridge=${BRIDGE},ip=${IP}"
if [[ "$IP" != "dhcp" ]]; then
  NET0="${NET0},gw=${GATEWAY}"
fi
if [[ -n "$VLAN_TAG" ]]; then
  NET0="${NET0},tag=${VLAN_TAG}"
fi

# --- 3. Create + start. Verified flags: --unprivileged, --rootfs STORAGE:GiB,
#     --features nesting=1 (needed for systemd guests), --onboot, --start
#     (pct(1) man page + wiki, accessed 2026-07-11).
CREATE_ARGS=(
  "$VMID" "${TEMPLATE_STORAGE}:vztmpl/${TEMPLATE}"
  --hostname "$HOSTNAME_LXC"
  --unprivileged 1
  --ostype debian
  --cores "$CORES"
  --memory "$MEMORY_MB"
  --rootfs "${STORAGE}:${DISK_GB}"
  --net0 "$NET0"
  --features nesting=1
  --onboot 1
  --start 1
)
if [[ -n "$PUBKEY_FILE" ]]; then
  CREATE_ARGS+=(--ssh-public-keys "$PUBKEY_FILE")
fi

pct create "${CREATE_ARGS[@]}"

pct status "$VMID"

cat <<EOF

LXC $VMID ($HOSTNAME_LXC) created and started.

NEXT STEP (README-deploy.md Stage B) — from this Proxmox shell:
  pct push $VMID 02-provision.sh /root/02-provision.sh
  pct push $VMID Caddyfile /root/Caddyfile
  pct exec $VMID -- bash /root/02-provision.sh

Get the container IP (needed later for deploy.ps1 -LxcHost):
  pct exec $VMID -- ip -4 addr show eth0
EOF
