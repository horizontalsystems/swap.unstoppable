# Deployment

Every push to `develop` deploys the site to the dev server by [`deploy-dev.yml`](../.github/workflows/deploy-dev.yml).
The build runs on the GitHub runner, not on the server (`next build` needs ~3 GB and the dev box has 4): the workflow
installs, builds with the `NEXT_PUBLIC_*` values from the `dev` environment's variables, packs the Next.js standalone
output ([`pack.sh`](pack.sh)), copies the archive over SSH and runs [`deploy.sh`](deploy.sh) there with `ARCHIVE` set,
which unpacks it into a release folder, points `current` at it and reloads pm2 (`swap-web`, port 3100). A change to a
`NEXT_PUBLIC_*` value needs a new build: edit the variable, then "Run workflow".

Without GitHub, on the server: `bash deploy/deploy.sh` builds on the box from `origin/develop` (reading `.env` for the
`NEXT_PUBLIC_*` values — keep it equal to the GitHub variables) and applies the result the same way; it is slow there.
`ARCHIVE=<file>.tgz bash deploy/deploy.sh` applies an archive built anywhere. The last three releases are kept.

The server itself — users, nginx path routing (`/` → port 3100), GitHub secrets — is described in uswap-server's
`deploy/README.md` (procedure) and `deploy/DEV_SERVER.md` (the dev box as built).
