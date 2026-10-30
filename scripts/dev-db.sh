#!/usr/bin/env bash
# Project-local PostgreSQL 16 cluster for development (no sudo required).
set -euo pipefail
PGBIN="${PGBIN:-/usr/lib/postgresql/16/bin}"
DIR="$(cd "$(dirname "$0")/.." && pwd)/.pgdata"
PORT="${PGPORT:-5433}"
case "${1:-start}" in
  start)
    if [ ! -d "$DIR" ]; then
      "$PGBIN/initdb" -D "$DIR" -U shop --auth=trust >/dev/null
    fi
    "$PGBIN/pg_ctl" -D "$DIR" -o "-p $PORT -k /tmp -c listen_addresses=localhost" -l "$DIR/log" -w start
    "$PGBIN/createdb" -h localhost -p "$PORT" -U shop shopsphere 2>/dev/null || true
    echo "DATABASE_URL=postgres://shop@localhost:$PORT/shopsphere"
    ;;
  stop) "$PGBIN/pg_ctl" -D "$DIR" -w stop ;;
  *) echo "usage: $0 start|stop"; exit 1 ;;
esac
