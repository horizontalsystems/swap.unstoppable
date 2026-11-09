#!/usr/bin/env bash
# Deploys one build of the web client on the server it runs on. Two ways to get the build:
#
#   ARCHIVE=<path>.tgz bash deploy/deploy.sh     # apply a build made elsewhere (what the GitHub
#                                                # workflow does: it builds, uploads, then runs this)
#   bash deploy/deploy.sh                        # build on this box from origin/develop, then apply
#   GIT_SHA=<sha> bash deploy/deploy.sh          # ... from an exact commit
#
# Either way the result is a release folder under $RELEASES — the Next.js standalone output
# (server.js + its node_modules + .next + public) plus ecosystem.config.js — pointed to by
# $RELEASES/current and run by pm2 as `swap-web`. The last $KEEP releases are kept for rollback
# (`pm2 delete swap-web && pm2 start $RELEASES/<older>/ecosystem.config.js && pm2 save`, then
# re-point `current` with `ln -sfn`; a reload would leave the process in the newer release).
#
# Building on the box needs ~3 GB of memory for `next build`; on a 4 GB host that is the swap
# file working hard, and it takes a few minutes. The archive path is the everyday one.
#
# Env: ARCHIVE, GIT_SHA (default: tip of origin/$BRANCH), BRANCH (default develop),
#      APP_DIR (default ~/swap.unstoppable, the git checkout), RELEASES (default ~/swap.unstoppable-releases).
set -euo pipefail

BRANCH="${BRANCH:-develop}"
APP_DIR="${APP_DIR:-$HOME/swap.unstoppable}"
RELEASES="${RELEASES:-$HOME/swap.unstoppable-releases}"
KEEP=3
HEALTH_ATTEMPTS=30   # × 2 s

log() { printf '\n==> %s\n' "$*"; }

# Packs the standalone output of the checkout in $1 into the archive $2. The same function runs on
# the GitHub runner (deploy/pack.sh sources this file), so both paths produce identical archives.
pack_build() {
  local src="$1" out="$2"
  # Next.js leaves static assets and public/ outside standalone/; the server expects them inside.
  rm -rf "$src/.next/standalone/.next/static" "$src/.next/standalone/public"
  cp -r "$src/.next/static" "$src/.next/standalone/.next/static"
  cp -r "$src/public" "$src/.next/standalone/public"
  cp "$src/ecosystem.config.js" "$src/.next/standalone/ecosystem.config.js"
  # A .env present at build time is copied into standalone/ by Next.js; the release must not carry one.
  rm -f "$src"/.next/standalone/.env*
  # GIT_SHA wins when set: deploy/build-linux.sh builds from `git archive`, which has no .git.
  printf '%s\n' "${GIT_SHA:-$(git -C "$src" rev-parse HEAD)}" > "$src/.next/standalone/GIT_SHA"
  tar -czf "$out" -C "$src/.next/standalone" .
}

# npm audit of the production dependencies, as a summary in the deploy log. It fails the deploy only at
# or above NPM_AUDIT_FAIL_LEVEL (low|moderate|high|critical; unset: never), because on 2026-11-04 every
# repository had open advisories and a deploy must still be able to ship their fixes. A registry that
# cannot be reached is reported and skipped.
audit_dependencies() {
  local report
  report="$(npm audit --omit=dev --json 2>/dev/null || true)"   # non-zero whenever anything is found
  printf '%s' "$report" | node -e '
    let d = ""
    process.stdin.on("data", c => (d += c)).on("end", () => {
      let r
      try { r = JSON.parse(d) } catch {}
      const m = r && r.metadata && r.metadata.vulnerabilities
      if (!m) { console.log("npm audit gave no report (registry unreachable?)"); return }
      const named = s => Object.values(r.vulnerabilities || {}).filter(v => v.severity === s).map(v => v.name).join(", ")
      console.log(`critical ${m.critical || 0}, high ${m.high || 0}, moderate ${m.moderate || 0}, low ${m.low || 0}`)
      if (m.critical) console.log(`critical: ${named("critical")}`)
      const order = ["low", "moderate", "high", "critical"]
      const fail = process.env.NPM_AUDIT_FAIL_LEVEL
      if (!fail) return
      if (!order.includes(fail)) { console.error(`NPM_AUDIT_FAIL_LEVEL=${fail} is not one of ${order.join("|")}`); process.exit(1) }
      if (order.slice(order.indexOf(fail)).some(s => m[s] > 0)) { console.error(`npm audit: findings at or above ${fail}`); process.exit(1) }
    })'
}

build_here() {
  cd "$APP_DIR"
  log "Fetching origin/$BRANCH"
  git fetch --prune origin "$BRANCH"
  GIT_SHA="${GIT_SHA:-$(git rev-parse "origin/$BRANCH")}"
  git cat-file -e "$GIT_SHA^{commit}" 2>/dev/null || git fetch origin "$GIT_SHA"

  log "Checking out $GIT_SHA on $BRANCH"
  if [ -n "$(git status --porcelain --untracked-files=no)" ]; then
    echo "Discarding local changes to tracked files:" >&2
    git status --short --untracked-files=no >&2
  fi
  git checkout -q -B "$BRANCH" "$GIT_SHA"
  git reset -q --hard "$GIT_SHA"
  git clean -fdq   # untracked files only; ignored ones (.env, node_modules/, .next/) are kept

  log "Installing dependencies"
  npm ci --no-audit --no-fund

  log "Auditing production dependencies"
  audit_dependencies

  log "Building (NEXT_PUBLIC_* values come from $APP_DIR/.env)"
  npm run build

  ARCHIVE="$RELEASES/incoming/web-$(git rev-parse --short HEAD).tgz"
  mkdir -p "$RELEASES/incoming"
  pack_build "$APP_DIR" "$ARCHIVE"
}

apply_archive() {
  local sha release
  mkdir -p "$RELEASES"
  sha="$(tar -xzOf "$ARCHIVE" ./GIT_SHA 2>/dev/null || tar -xzOf "$ARCHIVE" GIT_SHA)"
  [ -n "$sha" ] || { echo "archive carries no GIT_SHA" >&2; return 1; }
  release="$RELEASES/${sha:0:12}-$(date -u +%Y%m%d%H%M%S)"

  log "Unpacking $(basename "$ARCHIVE") into $release"
  mkdir -p "$release"
  tar -xzf "$ARCHIVE" -C "$release"
  [ -f "$release/server.js" ] && [ -f "$release/ecosystem.config.js" ] || { echo "archive is not a standalone build" >&2; return 1; }

  log "Restarting under pm2"
  ln -sfn "$release" "$RELEASES/current"
  # Every release is its own directory, and a pm2 reload keeps an existing process on the directory
  # it was started in, so the process is replaced rather than reloaded. Fork mode: a reload would be
  # a stop + start anyway, so this costs no extra downtime.
  pm2 delete swap-web >/dev/null 2>&1 || true
  pm2 start "$release/ecosystem.config.js"
  pm2 save

  local port
  port="$(node -e "console.log(require('$release/ecosystem.config.js').apps[0].env.PORT)")"
  log "Waiting for the web client on :$port"
  for _ in $(seq 1 "$HEALTH_ATTEMPTS"); do
    if curl -fs -o /dev/null "http://127.0.0.1:$port/"; then
      echo "swap-web is up on :$port at ${sha:0:7}"
      prune_releases
      return 0
    fi
    sleep 2
  done

  echo "swap-web did not answer on :$port within $((HEALTH_ATTEMPTS * 2))s; the new build is left running" >&2
  pm2 logs swap-web --lines 50 --nostream || true
  return 1
}

prune_releases() {
  # The $KEEP newest release folders stay, newest by the deploy time their name ends with
  # (<sha12>-<utc>), not by mtime: tar sets a folder's mtime to the BUILD time, so a rollback to an
  # older build would sort last and be deleted right after going live. `current` is a symlink, not a
  # release: it is never listed, and the folder it points at is never deleted.
  local live name
  live="$(readlink -f "$RELEASES/current" 2>/dev/null || true)"
  for name in $(find "$RELEASES" -mindepth 1 -maxdepth 1 -type d ! -name incoming -printf '%f\n' \
      | awk -F- '{ print $NF, $0 }' | sort -r | awk '{ print $2 }' | tail -n +$((KEEP + 1))); do
    [ "$RELEASES/$name" = "$live" ] && continue
    rm -rf -- "${RELEASES:?}/$name"
  done
  rm -f "$RELEASES"/incoming/*.tgz
}

main() {
  # Absolute paths: the workflow passes paths relative to the login directory (scp's SFTP mode does
  # not expand $HOME), and `current` must be an absolute symlink.
  mkdir -p "$RELEASES"; RELEASES="$(cd "$RELEASES" && pwd -P)"
  if [ -z "${ARCHIVE:-}" ]; then
    build_here
  fi
  [ -f "$ARCHIVE" ] || { echo "no such archive: $ARCHIVE" >&2; return 1; }
  ARCHIVE="$(cd "$(dirname "$ARCHIVE")" && pwd)/$(basename "$ARCHIVE")"
  apply_archive
}

# When this file is sourced for pack_build (deploy/pack.sh), nothing below runs.
# BASH_SOURCE is unset when the script arrives on stdin (`bash -s`), hence the default to $0.
if [ "${BASH_SOURCE[0]:-$0}" = "$0" ]; then
  # Everything runs inside main() with stdin closed: when this script arrives over `bash -s`, bash
  # reads it from stdin incrementally, and any command that reads stdin would eat the rest of it.
  main "$@" </dev/null
fi
