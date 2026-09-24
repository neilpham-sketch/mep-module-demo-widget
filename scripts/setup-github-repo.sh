#!/usr/bin/env bash
set -euo pipefail

# Bootstraps this generated module's GitHub repo: creates it under the org, pushes the
# qa/staging branches the deploy workflows trigger on, creates the "qa"/"staging" GitHub
# Environments those workflows read secrets/vars from (job-level `environment: qa` /
# `environment: staging`), applies branch protection (docs/ADR-0005 — PR-only), and sets
# the repo secret + per-environment secrets/variables .github/workflows/deploy-{qa,staging}.yml
# need. Mirrors mep-etr's real, already-working deploy pipeline (docs/ADR-0004) — same AWS
# long-lived keys (not OIDC), same GitHub Environments split, same Infisical-backed runtime
# config.
#
# Uses the GitHub REST API directly (curl) instead of the `gh` CLI — nothing to install.
#
# Requires:
#   - curl, git, node, and npm already on PATH (this is a Node project; npm installs
#     libsodium-wrappers into a throwaway temp dir once, ephemerally, to run the sealed-box
#     encryption GitHub's Actions-secrets API requires — see "ensure_libsodium" below — no
#     permanent dependency is added to this repo).
#   - GITHUB_TOKEN: a personal access token with the `repo` scope (classic), or a
#     fine-grained token with Contents/Administration/Secrets/Environments write on this
#     repo. If $ORG is a GitHub organization, creating the repo also needs Administration
#     on that org; if $ORG is your own personal account (MEP_GITHUB_ORG=<your-username>),
#     the repo is created under it via /user/repos instead and no org admin is needed. git
#     push still uses whatever auth you already have configured for github.com (SSH key or
#     credential helper) — GITHUB_TOKEN is only used for the REST API calls below.
#
# GH_TOKEN (the repo secret CI/the deploy host use for GitHub Packages + git clone) is set
# once at the repo level — it's the same value for qa and staging. Everything else
# (AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY, SSH_PRIVATE_KEY_B64, INFISICAL_TOKEN,
# INFISICAL_DOMAIN, MSTEAMS_WEBHOOK_URL as secrets; AWS_REGION, AWS_ACCOUNT_ID, SSH_HOST,
# SSH_USER, HOST, INFISICAL_PROJECT_ID, INFISICAL_ENV as variables) differs per environment,
# so this script reads it from QA_<NAME>/STAGING_<NAME>-prefixed local variables and writes
# each to the matching GitHub Environment under its bare name. This script skips anything
# already set (repo- or environment-scoped) and only reports what's missing.
#
# Usage: `cp .env.setup-github.example .env.setup-github`, fill it in, and run:
#   pnpm setup:github
# (.env.setup-github is gitignored and auto-loaded below if present; env vars you export
# yourself take priority over it — see the "already set" guard in the loader below.)

REPO="mep-module-demo-widget"
MODULE_KEY="demo-widget"
API="https://api.github.com"

# Set to 1 to skip repo creation, main/qa/staging branch push, and branch protection
# (the steps that need Administration rights on $ORG and touch the git remote) and only
# check/apply the GitHub Environments secrets & variables below — e.g. to see what's
# already configured without touching the repo itself:
#   SKIP_REPO_BOOTSTRAP=1 pnpm setup:github
SKIP_REPO_BOOTSTRAP="${SKIP_REPO_BOOTSTRAP:-0}"

ENVIRONMENTS=(qa staging)
ENV_SECRET_NAMES=(AWS_ACCESS_KEY_ID AWS_SECRET_ACCESS_KEY SSH_PRIVATE_KEY_B64 INFISICAL_TOKEN INFISICAL_DOMAIN MSTEAMS_WEBHOOK_URL)
ENV_VAR_NAMES=(AWS_REGION AWS_ACCOUNT_ID SSH_HOST SSH_USER HOST INFISICAL_PROJECT_ID INFISICAL_ENV)

declare -A SECRET_DESCRIPTIONS=(
  [AWS_ACCESS_KEY_ID]="IAM access key with ECR push to mepsaas/module-$MODULE_KEY-*"
  [AWS_SECRET_ACCESS_KEY]="IAM secret key matching AWS_ACCESS_KEY_ID"
  [SSH_PRIVATE_KEY_B64]="Deploy SSH private key (raw PEM or base64 — auto-detected)"
  [INFISICAL_TOKEN]="Infisical machine identity token for this environment"
  [INFISICAL_DOMAIN]="Infisical server domain (self-hosted) — e.g. https://infisical.example.com"
  [MSTEAMS_WEBHOOK_URL]="MS Teams incoming-webhook URL for deploy notifications"
)
declare -A VAR_DESCRIPTIONS=(
  [AWS_REGION]="AWS region the ECR repos and deploy host live in"
  [AWS_ACCOUNT_ID]="AWS account ID (used to build the ECR registry hostname)"
  [SSH_HOST]="Deploy host"
  [SSH_USER]="Deploy SSH user"
  [HOST]="Public hostname for this environment, written into docker/.env on the host"
  [INFISICAL_PROJECT_ID]="Infisical project ID this module's secrets live in"
  [INFISICAL_ENV]="Infisical environment slug to read from (e.g. qa, staging)"
)

# Names this script reads from the environment or .env.setup-github, built up so every
# QA_<NAME>/STAGING_<NAME> combination is included without hand-listing all of them. Listed
# explicitly (rather than sourcing blindly) so a variable already exported on the command
# line — e.g. `QA_HOST=... pnpm setup:github` — always overrides the file for that one run.
ENV_VARS=(GITHUB_TOKEN MEP_GITHUB_ORG GH_TOKEN)
for env_name in "${ENVIRONMENTS[@]}"; do
  prefix="$(printf '%s' "$env_name" | tr '[:lower:]' '[:upper:]')"
  for name in "${ENV_SECRET_NAMES[@]}" "${ENV_VAR_NAMES[@]}"; do
    ENV_VARS+=("${prefix}_${name}")
  done
done

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ENV_FILE="$SCRIPT_DIR/../.env.setup-github"
if [ -f "$ENV_FILE" ]; then
  echo "==> Loading $ENV_FILE (already-exported values still take priority)"
  declare -A PRESET
  for var in "${ENV_VARS[@]}"; do
    PRESET["$var"]="${!var:-}"
  done
  set -o allexport
  # shellcheck disable=SC1090
  source "$ENV_FILE"
  set +o allexport
  for var in "${ENV_VARS[@]}"; do
    if [ -n "${PRESET[$var]}" ]; then
      printf -v "$var" '%s' "${PRESET[$var]}"
      export "$var"
    fi
  done
fi

# Resolved only after .env.setup-github is loaded above, so MEP_GITHUB_ORG set there
# actually takes effect (it's read here, not before the file is sourced).
ORG="${MEP_GITHUB_ORG:-ProwerbDigital}"

for bin in curl git node npm; do
  command -v "$bin" >/dev/null 2>&1 || {
    echo "error: '$bin' not found on PATH" >&2
    exit 1
  }
done
: "${GITHUB_TOKEN:?export GITHUB_TOKEN (a PAT with the 'repo' scope), or set it in .env.setup-github (see .env.setup-github.example), before running this script}"

api() {
  # api METHOD PATH [JSON_BODY] — prints the response body, fails the script on HTTP >= 400.
  local method="$1" path="$2" body="${3:-}"
  local args=(-sS -X "$method" -H "Authorization: Bearer $GITHUB_TOKEN" \
    -H "Accept: application/vnd.github+json" -H "X-GitHub-Api-Version: 2022-11-28")
  [ -n "$body" ] && args+=(-d "$body")
  curl "${args[@]}" -w '\n%{http_code}' "$API$path" | {
    local response status
    response="$(cat)"
    status="${response##*$'\n'}"
    body_out="${response%$'\n'*}"
    if [ "$status" -ge 400 ]; then
      echo "error: $method $path -> HTTP $status: $body_out" >&2
      return 1
    fi
    echo "$body_out"
  }
}

json_get() {
  # json_get JSON_STRING JS_EXPRESSION_ON_"d" — tiny JSON field reader via node, avoids a jq dependency.
  node -e 'const d = JSON.parse(process.argv[1]); const r = eval(process.argv[2]); if (r !== undefined) console.log(r)' "$1" "$2"
}

LIBSODIUM_NODE_PATH=""
LIBSODIUM_TMP_DIR=""
ensure_libsodium() {
  # GitHub's Actions-secrets API requires libsodium's crypto_box_seal; Node's built-in
  # crypto module doesn't expose it, so this installs the (tiny, pure-JS/WASM)
  # libsodium-wrappers package into a throwaway prefix dir just for this run — nothing is
  # added to package.json. `npx -p` alone doesn't work here: recent npm only puts the
  # installed package's bin/ on PATH, it never exposes it to `require()` (no NODE_PATH is
  # set), so a plain `npx -p libsodium-wrappers node -e '...'` fails with MODULE_NOT_FOUND.
  #
  # Must be called directly (never as `x=$(ensure_libsodium)`) — command substitution
  # forks a subshell, and LIBSODIUM_NODE_PATH/LIBSODIUM_TMP_DIR are deliberately NOT
  # `local`, precisely so a direct call here is visible to the rest of this script
  # (set_secret calls this before its own `$(encrypt_secret ...)` for exactly that reason).
  [ -n "$LIBSODIUM_NODE_PATH" ] && return
  LIBSODIUM_TMP_DIR="$(mktemp -d)"
  trap 'rm -rf "$LIBSODIUM_TMP_DIR"' EXIT
  npm install --silent --no-audit --no-fund --no-save --prefix "$LIBSODIUM_TMP_DIR" libsodium-wrappers >/dev/null
  LIBSODIUM_NODE_PATH="$LIBSODIUM_TMP_DIR/node_modules"
}

encrypt_secret() {
  local public_key_b64="$1" value="$2"
  ensure_libsodium
  NODE_PATH="$LIBSODIUM_NODE_PATH" node -e '
    const sodium = require("libsodium-wrappers");
    (async () => {
      await sodium.ready;
      const key = sodium.from_base64(process.argv[1], sodium.base64_variants.ORIGINAL);
      const msg = sodium.from_string(process.argv[2]);
      const sealed = sodium.crypto_box_seal(msg, key);
      process.stdout.write(sodium.to_base64(sealed, sodium.base64_variants.ORIGINAL));
    })();
  ' "$public_key_b64" "$value"
}

set_secret() {
  # set_secret PATH_PREFIX KEY_ID PUBLIC_KEY NAME VALUE — PATH_PREFIX is either
  # "/repos/$ORG/$REPO/actions" (repo-level) or "/repos/$ORG/$REPO/environments/$env_name".
  local path_prefix="$1" key_id="$2" public_key="$3" name="$4" value="$5"
  local encrypted secret_body
  # Direct call (not `$(...)`), so libsodium installs at most once per script run even
  # though encrypt_secret below always executes inside a command-substitution subshell.
  ensure_libsodium
  encrypted="$(encrypt_secret "$public_key" "$value")"
  secret_body="$(node -e 'console.log(JSON.stringify({encrypted_value: process.argv[1], key_id: process.argv[2]}))' "$encrypted" "$key_id")"
  api PUT "$path_prefix/secrets/$name" "$secret_body" >/dev/null
}

if [ "$SKIP_REPO_BOOTSTRAP" = "1" ]; then
  echo "==> Skipping repo creation, branch push, and branch protection (SKIP_REPO_BOOTSTRAP=1)"
else
  echo "==> Repo: $ORG/$REPO"
  repo_status="$(curl -s -o /dev/null -w '%{http_code}' -H "Authorization: Bearer $GITHUB_TOKEN" "$API/repos/$ORG/$REPO")"
  if [ "$repo_status" = "200" ]; then
    echo "already exists, skipping creation."
  else
    # /orgs/$ORG/repos requires org Administration; if $ORG is actually a personal
    # account (no org involved), create it via /user/repos instead — no admin needed.
    owner_type="$(json_get "$(api GET "/users/$ORG")" 'd.type')"
    if [ "$owner_type" = "Organization" ]; then
      api POST "/orgs/$ORG/repos" "{\"name\":\"$REPO\",\"private\":true}" >/dev/null
    else
      api POST "/user/repos" "{\"name\":\"$REPO\",\"private\":true}" >/dev/null
    fi
    echo "created."
  fi

  # Generated modules start with no .git at all — bootstrap one + an initial commit so
  # there's something to push. No-op if this already is a repo with a commit.
  if ! git rev-parse --is-inside-work-tree >/dev/null 2>&1; then
    echo "==> No git repo here yet — running git init"
    git init -q
  fi
  if ! git rev-parse HEAD >/dev/null 2>&1; then
    echo "==> No commits yet — creating the initial commit"
    git add -A
    git commit -q -m "Initial commit: $REPO scaffold"
    git branch -M main
  fi

  git remote set-url origin "git@github.com:$ORG/$REPO.git" 2>/dev/null || git remote add origin "git@github.com:$ORG/$REPO.git"
  git push -u origin HEAD:main

  echo "==> Branches (qa, staging — deploy workflows trigger on push to these)"
  for branch in qa staging; do
    if git ls-remote --exit-code --heads origin "$branch" >/dev/null 2>&1; then
      echo "origin/$branch already exists, skipping."
    else
      git push origin "main:refs/heads/$branch"
    fi
  done

  echo "==> Branch protection (main, qa, staging — PR-only, ADR-0005)"
  protection_body='{
    "required_status_checks": { "strict": true, "contexts": ["verify"] },
    "enforce_admins": true,
    "required_pull_request_reviews": { "required_approving_review_count": 1 },
    "restrictions": null
  }'
  for branch in main qa staging; do
    if api PUT "/repos/$ORG/$REPO/branches/$branch/protection" "$protection_body" >/dev/null; then
      echo "protected: $branch"
    else
      echo "warning: could not set protection for '$branch' — needs admin on $ORG/$REPO, and the org plan must support branch protection on private repos" >&2
    fi
  done
fi

echo "==> GitHub Environments (qa, staging)"
for env_name in "${ENVIRONMENTS[@]}"; do
  api PUT "/repos/$ORG/$REPO/environments/$env_name" "{}" >/dev/null
  echo "ensured: $env_name"
done

echo "==> Repo secret: GH_TOKEN (shared across qa/staging — GitHub Packages + git-clone-on-host)"
repo_secrets_json="$(api GET "/repos/$ORG/$REPO/actions/secrets")"
repo_existing_secrets="$(json_get "$repo_secrets_json" 'd.secrets.map(s => s.name).join("\n")' || true)"
if echo "$repo_existing_secrets" | grep -qx "GH_TOKEN"; then
  echo "ok: GH_TOKEN already set"
elif [ -n "${GH_TOKEN:-}" ]; then
  repo_pubkey_json="$(api GET "/repos/$ORG/$REPO/actions/secrets/public-key")"
  repo_key_id="$(json_get "$repo_pubkey_json" 'd.key_id')"
  repo_public_key="$(json_get "$repo_pubkey_json" 'd.key')"
  set_secret "/repos/$ORG/$REPO/actions" "$repo_key_id" "$repo_public_key" "GH_TOKEN" "$GH_TOKEN"
  echo "set: GH_TOKEN"
else
  echo "skip: GH_TOKEN not set — export it (or add it to .env.setup-github): GitHub PAT (read:packages) used for GitHub Packages installs in CI and for 'git clone' on the deploy host" >&2
fi

for env_name in "${ENVIRONMENTS[@]}"; do
  prefix="$(printf '%s' "$env_name" | tr '[:lower:]' '[:upper:]')"
  echo "==> Environment '$env_name' secrets"
  env_secrets_json="$(api GET "/repos/$ORG/$REPO/environments/$env_name/secrets")"
  env_existing_secrets="$(json_get "$env_secrets_json" 'd.secrets.map(s => s.name).join("\n")' || true)"
  env_pubkey_json="$(api GET "/repos/$ORG/$REPO/environments/$env_name/secrets/public-key")"
  env_key_id="$(json_get "$env_pubkey_json" 'd.key_id')"
  env_public_key="$(json_get "$env_pubkey_json" 'd.key')"

  for name in "${ENV_SECRET_NAMES[@]}"; do
    if echo "$env_existing_secrets" | grep -qx "$name"; then
      echo "ok: $env_name/$name already set"
      continue
    fi
    var="${prefix}_${name}"
    value="${!var:-}"
    if [ -z "$value" ]; then
      echo "skip: $var not set (${SECRET_DESCRIPTIONS[$name]:-})" >&2
      continue
    fi
    set_secret "/repos/$ORG/$REPO/environments/$env_name" "$env_key_id" "$env_public_key" "$name" "$value"
    echo "set: $env_name/$name (from $var)"
  done

  echo "==> Environment '$env_name' variables"
  env_vars_json="$(api GET "/repos/$ORG/$REPO/environments/$env_name/variables")"
  env_existing_vars="$(json_get "$env_vars_json" 'd.variables.map(v => v.name).join("\n")' || true)"

  for name in "${ENV_VAR_NAMES[@]}"; do
    if echo "$env_existing_vars" | grep -qx "$name"; then
      echo "ok: $env_name/$name already set"
      continue
    fi
    var="${prefix}_${name}"
    value="${!var:-}"
    if [ -z "$value" ]; then
      echo "skip: $var not set (${VAR_DESCRIPTIONS[$name]:-})" >&2
      continue
    fi
    var_body="$(node -e 'console.log(JSON.stringify({name: process.argv[1], value: process.argv[2]}))' "$name" "$value")"
    api POST "/repos/$ORG/$REPO/environments/$env_name/variables" "$var_body" >/dev/null
    echo "set: $env_name/$name (from $var)"
  done
done

cat <<EOF

Done. Not automated here (real infra, provisioned once per module — see ADR-0004):
  - ECR repos mepsaas/module-$MODULE_KEY-{internal,external,worker}
  - docker network "mep" present on the QA and staging hosts
  - /home/github/mep-module-$MODULE_KEY/ on each host (git clone target — the deploy
    script creates this itself on first run, but the host needs docker + the AWS CLI
    prerequisites reachable, and an SSH user matching SSH_USER/SSH_PRIVATE_KEY_B64 above)
  - An Infisical project with a "/mep-module-$MODULE_KEY-{internal,external,worker}" secret
    path per environment (matches each Dockerfile's --path=... in its "infisical run" CMD)
  - Kong route registration (kong/route.yaml)
  - module registration in mep-tenant (ADR-0002), if this module needs to be deliverable to a tenant
EOF
