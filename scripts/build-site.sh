#!/bin/sh
# Builds dist/ for Cloudflare: copies only the files the web app needs, stamps
# the service worker with a version and the list of files to precache, and
# writes the _headers file (caching and security headers).
# reference/ (AHDB copyright images), scripts/, .claude/ and the project notes
# are deliberately never copied: only the paths listed below are.
set -e
cd "$(dirname "$0")/.."
rm -rf dist
mkdir -p dist
cp -R index.html styles.css manifest.webmanifest sw.js favicon.ico og-image.png icons src vendor dist/
find dist -name '.DS_Store' -delete

# --- Service worker version and precache list -------------------------------
# Version = a hash of every shipped file (names and contents), and nothing
# else. Browsers install a new worker, and the app shows "Update available",
# whenever the bytes of sw.js change, so the version must change exactly when
# what ships changes. Don't add the git commit, a date or anything about the
# machine: a commit that only touches docs or scripts, or rebuilding the same
# code, would then tell every user there is an update when there isn't.
# (Changes to the sw.js template change sw.js itself, so they update too.)
version=$(cd dist && find . -type f ! -name sw.js | LC_ALL=C sort | xargs shasum -a 256 | shasum -a 256 | cut -c1-12)
commit=$(git rev-parse --short HEAD 2>/dev/null || echo nogit)

python3 - "$version" "$commit" <<'PY'
import json, os, sys
version = sys.argv[1]
files = []
for root, _, names in os.walk('dist'):
    for n in names:
        p = os.path.relpath(os.path.join(root, n), 'dist')
        if p in ('sw.js', '_headers', 'index.html'):
            continue
        files.append(p)
# The page itself is cached as "./" (Cloudflare redirects /index.html to /).
files = ['./'] + sorted(files)
sw = open('dist/sw.js').read()
start, end = '/*__PRECACHE__*/', '/*__END__*/'
assert start in sw and end in sw and '__BUILD_VERSION__' in sw, 'sw.js tokens missing'
sw = sw[:sw.index(start)] + json.dumps(files, indent=2) + sw[sw.index(end) + len(end):]
sw = sw.replace('__BUILD_VERSION__', version)
open('dist/sw.js', 'w').write(sw)
print(f'Service worker {version}: {len(files)} files precached (built from commit {sys.argv[2]})')
PY

# --- Headers -----------------------------------------------------------------
# no-cache everywhere: browsers revalidate (cheap, with ETags) and always get the
# current version. sw.js, the page and the manifest especially must never be
# served stale. Offline use comes from the service worker's own cache, not the
# HTTP cache.
#
# CSP: scripts only from this site, plus the inline import map in index.html
# (allowed by its hash, computed here so it stays correct when the map changes)
# and Cloudflare Web Analytics. No inline styles are used (style properties set
# from JavaScript are allowed by CSP).
importmap_hash=$(python3 - <<'PY'
import base64, hashlib, re
html = open('dist/index.html').read()
maps = re.findall(r'<script type="importmap">(.*?)</script>', html, re.S)
assert len(maps) == 1, 'expected exactly one inline import map'
assert len(re.findall(r'<script(?![^>]*\bsrc=)[^>]*>', html)) == 1, 'unexpected inline <script> in index.html: move it to a file'
print(base64.b64encode(hashlib.sha256(maps[0].encode()).digest()).decode())
PY
)
csp="default-src 'self'; script-src 'self' 'sha256-$importmap_hash' https://static.cloudflareinsights.com; style-src 'self'; img-src 'self' data:; font-src 'self'; connect-src 'self' https://cloudflareinsights.com; manifest-src 'self'; worker-src 'self'; object-src 'none'; base-uri 'self'; form-action 'none'; frame-ancestors 'none'"

cat > dist/_headers <<EOF
/*
  Cache-Control: no-cache
  X-Content-Type-Options: nosniff
  Referrer-Policy: strict-origin-when-cross-origin
  Permissions-Policy: camera=(), microphone=(), geolocation=(), payment=(), usb=()
  X-Frame-Options: DENY
  Strict-Transport-Security: max-age=31536000
  Content-Security-Policy: $csp
EOF

echo "Built dist/ ($(du -sh dist | cut -f1))"
