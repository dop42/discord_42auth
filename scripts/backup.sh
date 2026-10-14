#!/usr/bin/env bash
# Encrypted, rotated database backup. Run daily from cron.
#
# Docker, from the repository root (passphrase read from BACKUP_PASSPHRASE in .env):
#   0 4 * * * cd /path/to/discord_42auth && ./scripts/backup.sh
# systemd, as root, against the local PostgreSQL over its socket:
#   0 4 * * * BACKUP_DB=discord_42auth BACKUP_DIR=/var/backups/discord_42auth \
#             BACKUP_PASSPHRASE_FILE=/root/.auth42-backup-passphrase /path/to/scripts/backup.sh
#
# Restore:
#   gpg -d <file>.sql.gz.gpg | gunzip | docker compose exec -T db psql -U discord_42auth discord_42auth
#   gpg -d <file>.sql.gz.gpg | gunzip | runuser -u postgres -- psql discord_42auth
set -euo pipefail
umask 077

KEEP_DAYS=7
DIR=${BACKUP_DIR:-backups}

if [[ -n ${BACKUP_PASSPHRASE_FILE:-} ]]; then
	PASSPHRASE=$(<"$BACKUP_PASSPHRASE_FILE")
else
	PASSPHRASE=$(grep -E '^BACKUP_PASSPHRASE=' .env | cut -d= -f2- || true)
	# `node --env-file` strips surrounding quotes; do the same so both read one passphrase.
	PASSPHRASE=${PASSPHRASE%\"}
	PASSPHRASE=${PASSPHRASE#\"}
fi
[[ -n $PASSPHRASE ]] || { echo "backup: no passphrase (BACKUP_PASSPHRASE or BACKUP_PASSPHRASE_FILE)" >&2; exit 1; }

dump() {
	if [[ -n ${BACKUP_DB:-} ]]; then
		runuser -u postgres -- pg_dump "$BACKUP_DB"
	else
		docker compose exec -T db pg_dump -U discord_42auth discord_42auth
	fi
}

mkdir -p "$DIR"
chmod 700 "$DIR"
FILE="$DIR/$(date -u +%Y%m%dT%H%M%SZ).sql.gz.gpg"
# A failed dump must not leave a file that looks like a backup.
trap 'rm -f "$FILE"' ERR

dump | gzip | gpg --batch --yes --symmetric --cipher-algo AES256 --passphrase-fd 3 -o "$FILE" 3<<<"$PASSPHRASE"

# Decrypt and check the dump really ends like one before trusting it with the rotation.
if ! gpg --batch --quiet --passphrase-fd 3 -d "$FILE" 3<<<"$PASSPHRASE" | gunzip | tail -n 5 | grep -q 'PostgreSQL database dump complete'; then
	rm -f "$FILE"
	echo "backup: $FILE is incomplete, older backups kept" >&2
	exit 1
fi
trap - ERR

# Personal data must not outlive the retention announced on /privacy. -mmin rather than
# -mtime, which rounds down to whole days and would keep an eighth one.
find "$DIR" -name '*.sql.gz.gpg' -mmin +$((KEEP_DAYS * 24 * 60)) -delete
echo "backup written: $FILE"
