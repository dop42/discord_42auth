#!/bin/sh
# Déploie le commit courant (HEAD) sur le serveur, sans Docker :
#   ./scripts/deploy.sh [hôte-ssh]        # par défaut : prox
#
# Le code est envoyé par `git archive` (rien de non commité ne part), construit sur le
# serveur dans app.new, puis échangé avec app. Le service systemd redémarre ; s'il ne
# répond pas sur /health en 30 s, l'ancienne version est remise en place.
# Les migrations ne reviennent pas en arrière : une migration ratée se corrige par un
# nouveau commit.
#
# Prérequis sur le serveur (voir docs/SETUP.md, « Without Docker ») : Node 22 via nvm pour
# root, PostgreSQL, l'utilisateur système auth42, /srv/discord_42auth/.env.
set -eu

HOST=${1:-prox}
ROOT=/srv/discord_42auth

cd "$(dirname "$0")/.."
if [ -n "$(git status --porcelain)" ]; then
	echo "Des changements ne sont pas commités : seul HEAD est déployé. Commite d'abord." >&2
	exit 1
fi
REV=$(git rev-parse --short HEAD)
echo "→ envoi de $REV vers $HOST"

git archive --format=tar HEAD |
	ssh "$HOST" "rm -rf $ROOT/app.new && mkdir -p $ROOT/app.new && tar -x -C $ROOT/app.new"

ssh "$HOST" "ROOT=$ROOT REV=$REV sh -s" <<'REMOTE'
set -eu
NODE_BIN=$(ls -d /root/.nvm/versions/node/v22.*/bin | sort -V | tail -1)
export PATH="$NODE_BIN:$PATH"
cd "$ROOT/app.new"

echo "→ construction (node $(node -v))"
npm ci --no-audit --no-fund --loglevel=error
npm run build --silent
(cd web && npm ci --no-audit --no-fund --loglevel=error && npm run build --silent >/dev/null)
rm -rf web/node_modules
npm prune --omit=dev --no-audit --no-fund --loglevel=error
echo "$REV" > REVISION

# Le service exécute la même version de Node que celle qui a construit.
install -m 755 "$NODE_BIN/node" /usr/local/bin/node
if ! cmp -s deploy/discord_42auth.service /etc/systemd/system/discord_42auth.service; then
	install -m 644 deploy/discord_42auth.service /etc/systemd/system/discord_42auth.service
	systemctl daemon-reload
fi
systemctl enable discord_42auth >/dev/null 2>&1

echo "→ bascule"
chown -R root:root "$ROOT/app.new"
chmod -R go-w "$ROOT/app.new"
rm -rf "$ROOT/app.prev"
[ -d "$ROOT/app" ] && mv "$ROOT/app" "$ROOT/app.prev"
mv "$ROOT/app.new" "$ROOT/app"
systemctl restart discord_42auth

healthy() {
	i=0
	while [ $i -lt 30 ]; do
		if [ "$(curl -s --max-time 2 -o /dev/null -w '%{http_code}' http://127.0.0.1:3000/health)" = 200 ]; then return 0; fi
		i=$((i + 1))
		sleep 1
	done
	return 1
}

if healthy; then
	echo "✓ $REV en ligne"
	exit 0
fi

echo "✗ $REV ne répond pas, retour à la version précédente" >&2
journalctl -u discord_42auth -n 30 --no-pager >&2 || true
if [ -d "$ROOT/app.prev" ]; then
	rm -rf "$ROOT/app.failed"
	mv "$ROOT/app" "$ROOT/app.failed"
	mv "$ROOT/app.prev" "$ROOT/app"
	# L'unité de la version précédente revient avec elle : une option systemd refusée par
	# l'hôte ne doit pas faire tomber aussi l'ancienne version.
	install -m 644 "$ROOT/app/deploy/discord_42auth.service" /etc/systemd/system/discord_42auth.service
	systemctl daemon-reload
	systemctl restart discord_42auth
	healthy && echo "↺ version précédente ($(cat "$ROOT/app/REVISION" 2>/dev/null || echo ?)) en ligne" >&2
fi
exit 1
REMOTE
