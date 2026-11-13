#!/usr/bin/env bash
# Build a WordPress.org-ready zip of the reactpress-blog theme only.
# Kept outside the theme folder so Theme Check never finds a .sh in the package.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")" && pwd)"
THEME_DIR="$ROOT/reactpress-blog"
REPO_ROOT="$(cd "$ROOT/.." && pwd)"
DIST="$REPO_ROOT/dist"
THEME_NAME="reactpress-blog"
ZIP="$DIST/${THEME_NAME}.zip"

if [[ ! -d "$THEME_DIR" ]]; then
	echo "Theme directory not found: $THEME_DIR" >&2
	exit 1
fi

mkdir -p "$DIST"
rm -f "$ZIP"

# Zip from parent so the archive root is reactpress-blog/
(
	cd "$ROOT"
	zip -r "$ZIP" "$THEME_NAME" \
		-x "${THEME_NAME}/.git/*" \
		-x "${THEME_NAME}/.DS_Store" \
		-x "${THEME_NAME}/**/.DS_Store" \
		-x "${THEME_NAME}/bin/*" \
		-x "${THEME_NAME}/README.md" \
		-x "${THEME_NAME}/SUBMIT.md" \
		-x "${THEME_NAME}/assets/js/blocks-editor.js"
)

echo "Created: $ZIP"
unzip -l "$ZIP" | head -n 40
echo
echo "Sanity checks:"
if unzip -l "$ZIP" | grep -E '\.sh$|blocks-editor\.js|bin/' >/dev/null; then
	echo "ERROR: package still contains shell scripts or excluded paths" >&2
	unzip -l "$ZIP" | grep -E '\.sh$|blocks-editor\.js|bin/' || true
	exit 1
fi
echo "OK: no .sh / bin / blocks-editor.js in zip"
