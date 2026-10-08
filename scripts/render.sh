#!/bin/sh
# render.sh — render RDD markdown documents (and the registry) into self-contained HTML pages.
# placeholder-check: ignore-file  (this script fills the shell template's tokens)
#
# Usage:
#   sh scripts/render.sh <file.md | registry.json | dir> [more paths...] [--assets DIR]
#   sh scripts/render.sh --all [--assets DIR]
#
#   - file.md        → file.html next to it (one interactive page per document).
#                      Only documents whose frontmatter has a `doc:` key are rendered.
#   - registry.json  → registry.html next to it (the experiment dashboard).
#   - dir            → every document in it (not recursive), plus its registry.json.
#   - --all          → from the project root: PLAN.md, notebook/, experiments/ and each
#                      experiments/<ID>/, specs/<module>/, reports/, docs/.
#   - --assets DIR   → folder with page-shell.html.template, research.css and research.js.
#                      Default: walk up from each path looking for
#                      <harness-dir>/skills/research-workflow/templates/render/ ($RDD_HARNESS_DIR,
#                      .claude, .codex, .cursor, .opencode, .agents), then the kit's templates/render/.
#
# No runtime needed (POSIX sh, sed, awk): the source is embedded verbatim and rendered in
# the browser by research.js. Conventions: skills/research-workflow/doc-format.md.
# KEEP IN SYNC with scripts/render.ps1.

set -eu

usage() {
  echo "Usage: sh render.sh <file.md | registry.json | dir> [...] [--assets DIR]" >&2
  echo "       sh render.sh --all [--assets DIR]" >&2
  exit 1
}

script_dir=$(cd "$(dirname "$0")" && pwd)
assets=""
all=""

prev=""
for arg in "$@"; do
  if [ "$prev" = "--assets" ]; then assets=$arg; fi
  case "$arg" in -h|--help) usage ;; --all) all=1 ;; esac
  prev=$arg
done
[ $# -gt 0 ] || usage

# Find the assets folder for a directory.
find_assets() {
  if [ -n "$assets" ]; then
    [ -f "$assets/research.js" ] || { echo "assets not found in $assets" >&2; return 1; }
    printf '%s\n' "$assets"
    return 0
  fi
  dir=$(cd "$1" && pwd)
  while :; do
    for h in ${RDD_HARNESS_DIR:-} .claude .codex .cursor .opencode .agents; do
      candidate="$dir/$h/skills/research-workflow/templates/render"
      if [ -f "$candidate/research.js" ]; then printf '%s\n' "$candidate"; return 0; fi
    done
    parent=$(dirname "$dir")
    [ "$parent" = "$dir" ] && break
    dir=$parent
  done
  if [ -f "$script_dir/../templates/render/research.js" ]; then
    (cd "$script_dir/../templates/render" && pwd)
    return 0
  fi
  echo "assets not found for $1 (use --assets DIR)" >&2
  return 1
}

# Keep only characters that are safe in an HTML attribute and an awk replacement.
safe() { printf '%s' "$1" | tr -c 'A-Za-z0-9._/-' '-'; }

# A renderable document: frontmatter with a `doc:` key that is not `doc: feedback`.
is_doc() {
  [ -f "$1" ] || return 1
  awk '
    NR == 1 { if ($0 !~ /^---/) { bad = 1; exit } next }
    /^---/ { closed = 1; exit }
    /^doc:[ \t]*feedback/ { bad = 1; exit }
    /^doc:/ { found = 1 }
    END { exit (!bad && closed && found) ? 0 : 1 }
  ' "$1"
}

# Write one <script> source block. "</script" is escaped so the source cannot close its
# own block; research.js reverses it (and JSON.parse reads "<\/" as "</").
embed() { # file type
  {
    printf '<script type="%s" data-file="%s">\n' "$2" "$(safe "$(basename "$1")")"
    sed 's#</[sS][cC][rR][iI][pP][tT]#<\\/script#g' "$1"
    printf '\n</script>\n'
  } > "$sources"
}

# Fill the shell template: {{CSS}}, {{JS}}, {{SOURCES}} lines are replaced by file contents;
# {{TITLE}}, {{SLUG}}, {{MODE}}, {{SOURCE}} by sanitized values.
assemble() { # assets_dir mode slug source out
  shell="$1/page-shell.html.template"
  [ -f "$shell" ] || { echo "missing $shell" >&2; return 1; }
  awk -v css="$1/research.css" -v js="$1/research.js" -v src="$sources" \
      -v mode="$2" -v slug="$3" -v source="$4" '
    function cat(f,   l) { while ((getline l < f) > 0) print l; close(f) }
    /\{\{CSS\}\}/     { cat(css); next }
    /\{\{JS\}\}/      { cat(js); next }
    /\{\{SOURCES\}\}/ { cat(src); next }
    { gsub(/\{\{TITLE\}\}/, slug); gsub(/\{\{SLUG\}\}/, slug); gsub(/\{\{MODE\}\}/, mode)
      gsub(/\{\{SOURCE\}\}/, source); print }
  ' "$shell" > "$5.tmp"
  mv "$5.tmp" "$5"
}

rendered=0
status=0

render_file() { # path
  path=${1#./}
  dir=$(dirname "$path")
  a=$(find_assets "$dir") || { status=1; return 0; }
  name=$(basename "$path")
  base=${name%.*}
  if [ "$dir" = "." ]; then slug=$base; else slug="$(basename "$dir")-$base"; fi
  case "$name" in
    *.json) mode=registry; type=application/json ;;
    *) mode=doc; type=text/markdown ;;
  esac
  out="$dir/$base.html"
  embed "$path" "$type"
  assemble "$a" "$mode" "$(safe "$slug")" "$(safe "$path")" "$out" || { status=1; return 0; }
  echo "rendered $path -> $out"
  rendered=$((rendered + 1))
}

render_dir() { # dir
  d=${1%/}
  [ -d "$d" ] || return 0
  [ -f "$d/registry.json" ] && render_file "$d/registry.json"
  for f in "$d"/*.md; do
    if is_doc "$f"; then render_file "$f"; fi
  done
}

sources=$(mktemp "${TMPDIR:-/tmp}/rdd-render.XXXXXX")
trap 'rm -f "$sources"' EXIT

if [ -n "$all" ]; then
  is_doc PLAN.md && render_file PLAN.md
  for d in notebook experiments experiments/*/ specs/*/ reports docs; do render_dir "$d"; done
  [ "$rendered" -gt 0 ] || echo "nothing to render (run from the project root)" >&2
  exit $status
fi

skip=""
for path in "$@"; do
  if [ "$skip" = 1 ]; then skip=""; continue; fi
  case "$path" in
    --assets) skip=1; continue ;;
    --all) continue ;;
  esac
  if [ -d "$path" ]; then
    render_dir "$path"
  elif [ -f "$path" ]; then
    case "$path" in
      *.json) render_file "$path" ;;
      *) if is_doc "$path"; then render_file "$path"; else echo "skip (no doc: frontmatter): $path" >&2; fi ;;
    esac
  else
    echo "skip (not found): $path" >&2
    status=1
  fi
done
exit $status
