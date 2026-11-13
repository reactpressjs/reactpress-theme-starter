#!/usr/bin/env bash
# Build a WordPress.org-ready zip of the reactpress-blog theme only.
# Kept outside the theme folder so Theme Check never finds a .sh in the package.
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PLATFORM_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
THEME_NAME="reactpress-blog"
THEME_DIR="$PLATFORM_DIR/$THEME_NAME"
REPO_ROOT="$(cd "$PLATFORM_DIR/../.." && pwd)"
DIST="$REPO_ROOT/dist"
ZIP="$DIST/${THEME_NAME}.zip"

if [[ ! -d "$THEME_DIR" ]]; then
	echo "Theme directory not found: $THEME_DIR" >&2
	exit 1
fi

mkdir -p "$DIST"
rm -f "$ZIP"

# Zip from platform dir so the archive root is reactpress-blog/
(
	cd "$PLATFORM_DIR"
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
LISTING="$(unzip -l "$ZIP")"
echo "$LISTING" | head -n 40
echo
echo "Sanity checks:"
if echo "$LISTING" | grep -E '\.sh$|blocks-editor\.js|/bin/' >/dev/null; then
	echo "ERROR: package still contains shell scripts or excluded paths" >&2
	echo "$LISTING" | grep -E '\.sh$|blocks-editor\.js|/bin/' || true
	exit 1
fi
if ! echo "$LISTING" | grep -F "${THEME_NAME}/inc/setup.php" >/dev/null; then
	echo "ERROR: package missing inc/ modules" >&2
	exit 1
fi
echo "OK: no .sh / bin / blocks-editor.js in zip; inc/ modules present"
