#!/bin/sh
# Encrypted, rotated database backup. Run daily from cron, from the repository root:
#   0 4 * * * cd /path/to/discord_42auth && ./scripts/backup.sh
# Needs BACKUP_PASSPHRASE in .env. Restore:
#   gpg -d backups/<file>.sql.gz.gpg | gunzip | docker compose exec -T db psql -U discord_42auth discord_42auth
set -eu

KEEP_DAYS=7
DIR=backups

PASSPHRASE=$(grep -E '^BACKUP_PASSPHRASE=' .env | cut -d= -f2-)
[ -n "$PASSPHRASE" ] || { echo "BACKUP_PASSPHRASE missing from .env" >&2; exit 1; }

mkdir -p "$DIR"
chmod 700 "$DIR"
FILE="$DIR/$(date -u +%Y%m%dT%H%M%SZ).sql.gz.gpg"

docker compose exec -T db pg_dump -U discord_42auth discord_42auth \
	| gzip \
	| gpg --batch --yes --symmetric --cipher-algo AES256 --passphrase-fd 3 -o "$FILE" 3<<EOF_PASS
$PASSPHRASE
EOF_PASS

# Personal data must not outlive the retention announced on /privacy.
find "$DIR" -name '*.sql.gz.gpg' -mtime +"$KEEP_DAYS" -delete
echo "backup written: $FILE"
