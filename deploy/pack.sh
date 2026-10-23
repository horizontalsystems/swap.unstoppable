#!/usr/bin/env bash
# Packs the standalone build in the current checkout into $1 (a .tgz), the way deploy.sh does on
# the server. Run by the GitHub workflow after `next build`.
set -euo pipefail
# shellcheck source=deploy.sh
. "$(dirname "$0")/deploy.sh"
pack_build "$(pwd)" "$1"
