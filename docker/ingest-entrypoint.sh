#!/bin/sh
# Trust an extra CA (a corporate or sandbox TLS-inspecting proxy) in every tool the ingest
# container uses: Node reads NODE_EXTRA_CA_CERTS itself; Chromium reads only its NSS store, so the
# certificates are imported there. Nothing is imported when no extra CA is given.
set -e
if [ -n "$EXTRA_CA_CERTS" ] && [ -s "$EXTRA_CA_CERTS" ]; then
  export NODE_EXTRA_CA_CERTS="$EXTRA_CA_CERTS"
  db="$HOME/.pki/nssdb"
  if [ ! -f "$db/cert9.db" ]; then
    mkdir -p "$db" && certutil -d "sql:$db" -N --empty-password
    tmp=$(mktemp -d)
    awk -v dir="$tmp" '/BEGIN CERTIFICATE/{n++} n{print > (dir "/ca" n ".pem")}' "$EXTRA_CA_CERTS"
    for f in "$tmp"/ca*.pem; do certutil -d "sql:$db" -A -t "C,," -n "extra-$(basename "$f" .pem)" -i "$f" 2>/dev/null || true; done
    rm -rf "$tmp"
  fi
fi
exec "$@"
