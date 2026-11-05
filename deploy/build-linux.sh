#!/usr/bin/env bash
# Builds a release archive on a developer's machine, for a server that does not build (production):
# the exact commit, in a linux/amd64 Node container, so the native binaries Next.js ships (sharp, …)
# are the server's and not the laptop's. The checkout is not touched: the container gets
# `git archive <sha>` on stdin and builds inside itself.
#
#   ENV_FILE=~/.config/uswap/swap.unstoppable.env bash deploy/build-linux.sh <sha>
#
# ENV_FILE holds the build-time values only (the NEXT_PUBLIC_* ones, inlined into the browser
# bundle, so nothing secret), one NAME=value per line, no quotes — Docker's --env-file format.
# Prints the archive's path; copy it to the server and apply it with deploy.sh's ARCHIVE path.
set -euo pipefail

ref="${1:?usage: build-linux.sh <sha>}"
ENV_FILE="${ENV_FILE:?set ENV_FILE to the NEXT_PUBLIC_* values for the target environment}"
[ -f "$ENV_FILE" ] || { echo "no such file: $ENV_FILE" >&2; exit 1; }
sha="$(git rev-parse "$ref^{commit}")"
out="${OUT_DIR:-$(mktemp -d)}"
archive="web-${sha:0:12}.tgz"

git archive --format=tar "$sha" | docker run --rm -i --platform linux/amd64 \
  --env-file "$ENV_FILE" -e GIT_SHA="$sha" -e NEXT_TELEMETRY_DISABLED=1 -e ARCHIVE_NAME="$archive" \
  -v "$out:/out" node:24 bash -euo pipefail -c '
    mkdir /src && cd /src && tar -x
    npm ci --no-audit --no-fund
    bash -c ". deploy/deploy.sh && audit_dependencies"
    npm run build
    bash deploy/pack.sh "/out/$ARCHIVE_NAME"
  '
echo "$out/$archive"
