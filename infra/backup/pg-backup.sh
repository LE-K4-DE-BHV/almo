#!/usr/bin/env bash
# Daily Postgres backup for the almo-shop stack (see Sprint 6 decision in docs/backlog.md:
# local retention only, no offsite copy in this phase - covers accidental data loss/a bad
# migration, not a disaster where the whole VPS is gone).
#
# Not run automatically by anything in this repo - install it on the VPS by hand:
#   1. Copy this file to e.g. /opt/almo/pg-backup.sh (or run it straight from the checked-out
#      repo path) and `chmod +x` it.
#   2. Add a crontab entry (as the user that can run `docker compose` in the project dir):
#        0 3 * * * /opt/almo/pg-backup.sh >> /var/log/almo-pg-backup.log 2>&1
#      (03:00 server time - low-traffic hour, well clear of the shared VPS's other backup jobs)
#   3. Make sure BACKUP_DIR below is writable and has enough disk space for a week of dumps.
#
# Run manually to test: ./pg-backup.sh

set -euo pipefail

# Directory containing docker-compose.yml and .env for this stack - adjust if this script is
# copied somewhere other than the repo root.
PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
BACKUP_DIR="${BACKUP_DIR:-/var/backups/almo-postgres}"
RETENTION_DAYS="${RETENTION_DAYS:-7}"

# Only pull out the two vars actually needed - not `source`-ing the whole .env, since it holds
# unquoted values with spaces (e.g. BREVO_SENDER_NAME=Almo Schmuck) that are valid for docker
# compose's own env-file parser but not for bash, which would otherwise try to run "Schmuck" as a
# command.
DB_USER="$(grep -m1 '^DB_USER=' "$PROJECT_DIR/.env" | cut -d= -f2-)"
DB_NAME="$(grep -m1 '^DB_NAME=' "$PROJECT_DIR/.env" | cut -d= -f2-)"

mkdir -p "$BACKUP_DIR"

timestamp="$(date +%Y-%m-%d_%H-%M-%S)"
dump_file="$BACKUP_DIR/almo-${timestamp}.sql.gz"

# `docker compose exec` runs inside the db container - no need to expose Postgres's port to the
# host (see docker-compose.yml comment: db is internal-network-only by design).
docker compose -f "$PROJECT_DIR/docker-compose.yml" exec -T db \
  pg_dump -U "${DB_USER:-almo}" "${DB_NAME:-almo}" | gzip > "$dump_file"

echo "Backup written to $dump_file"

# Delete dumps older than the retention window - keeps disk usage bounded without a separate
# cleanup job.
find "$BACKUP_DIR" -name 'almo-*.sql.gz' -mtime "+${RETENTION_DAYS}" -delete
