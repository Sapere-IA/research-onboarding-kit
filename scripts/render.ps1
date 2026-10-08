# render.ps1 — render RDD markdown documents (and the registry) into self-contained HTML pages (Windows).
# placeholder-check: ignore-file  (this script fills the shell template's tokens)
#
# Usage:
#   pwsh scripts/render.ps1 <file.md | registry.json | dir> [more paths...] [-Assets DIR]
#   pwsh scripts/render.ps1 -All [-Assets DIR]
#
#   - file.md        → file.html next to it (one interactive page per document).
#                      Only documents whose frontmatter has a `doc:` key are rendered.
#   - registry.json  → registry.html next to it (the experiment dashboard).
#   - dir            → every document in it (not recursive), plus its registry.json.
#   - -All           → from the project root: PLAN.md, notebook/, experiments/ and each
#                      experiments/<ID>/, specs/<module>/, reports/, docs/.
#   - -Assets DIR    → folder with page-shell.html.template, research.css and research.js.
#                      Default: walk up from each path looking for
#                      <harness-dir>/skills/research-workflow/templates/render/ ($env:RDD_HARNESS_DIR,
#                      .claude, .codex, .cursor, .opencode, .agents), then the kit's templates/render/.
#
# Works with Windows PowerShell 5.1 and PowerShell 7. The source is embedded verbatim and
# rendered in the browser by research.js. Conventions: skills/research-workflow/doc-format.md.
# KEEP IN SYNC with scripts/render.sh.

param(
  [Parameter(ValueFromRemainingArguments = $true)]
  [string[]] $Paths = @(),
  [string] $Assets = '',
  [switch] $All
)

$ErrorActionPreference = 'Stop'
$utf8 = New-Object System.Text.UTF8Encoding($false)
$script:rendered = 0
$script:status = 0

if (-not $All -and $Paths.Count -eq 0) {
  [Console]::Error.WriteLine('Usage: pwsh render.ps1 <file.md | registry.json | dir> [...] [-Assets DIR]')
  [Console]::Error.WriteLine('       pwsh render.ps1 -All [-Assets DIR]')
  exit 1
}

# Find the assets folder for a directory.
function Find-Assets([string] $start) {
  if ($Assets) {
    if (-not (Test-Path -LiteralPath (Join-Path $Assets 'research.js'))) { throw "assets not found in $Assets" }
    return (Resolve-Path -LiteralPath $Assets).Path
  }
  $harnessDirs = @()
  if ($env:RDD_HARNESS_DIR) { $harnessDirs += $env:RDD_HARNESS_DIR }
  $harnessDirs += '.claude', '.codex', '.cursor', '.opencode', '.agents'
  $dir = (Resolve-Path -LiteralPath $start).Path
  while ($dir) {
    foreach ($h in $harnessDirs) {
      $candidate = [System.IO.Path]::Combine($dir, $h, 'skills', 'research-workflow', 'templates', 'render')
      if (Test-Path -LiteralPath (Join-Path $candidate 'research.js')) { return $candidate }
    }
    $parent = Split-Path -Parent $dir
    if (-not $parent -or $parent -eq $dir) { break }
    $dir = $parent
  }
  $kit = [System.IO.Path]::Combine($PSScriptRoot, '..', 'templates', 'render')
  if (Test-Path -LiteralPath (Join-Path $kit 'research.js')) { return (Resolve-Path -LiteralPath $kit).Path }
  throw "assets not found for $start (use -Assets DIR)"
}

# Keep only characters that are safe in an HTML attribute (same set as render.sh).
function Safe([string] $s) { return ($s -replace '[^A-Za-z0-9._/-]', '-') }

function Read-Text([string] $path) { return [System.IO.File]::ReadAllText($path, $utf8) }

# A renderable document: frontmatter with a `doc:` key that is not `doc: feedback`.
function Test-Doc([string] $path) {
  if (-not (Test-Path -LiteralPath $path -PathType Leaf)) { return $false }
  $lines = [System.IO.File]::ReadAllLines((Resolve-Path -LiteralPath $path).Path, $utf8)
  if ($lines.Count -lt 2 -or -not $lines[0].StartsWith('---')) { return $false }
  $found = $false
  for ($i = 1; $i -lt $lines.Count; $i++) {
    $line = $lines[$i]
    if ($line.StartsWith('---')) { return $found }
    if ($line -match '^doc:[ \t]*feedback') { return $false }
    if ($line.StartsWith('doc:')) { $found = $true }
  }
  return $false  # frontmatter never closed
}

# One <script> source block. "</script" is escaped so the source cannot close its own
# block; research.js reverses it (and JSON.parse reads "<\/" as "</").
function Embed([string] $path, [string] $type) {
  $text = (Read-Text $path) -replace '(?i)</script', '<\/script'
  return "<script type=`"$type`" data-file=`"$(Safe (Split-Path -Leaf $path))`">`n$text`n</script>`n"
}

function Assemble([string] $assetsDir, [string] $mode, [string] $slug, [string] $source, [string] $sources, [string] $out) {
  $shellPath = Join-Path $assetsDir 'page-shell.html.template'
  if (-not (Test-Path -LiteralPath $shellPath)) { throw "missing $shellPath" }
  $shell = Read-Text $shellPath
  # String.Replace is literal: no regex or '$' substitution surprises in the inlined files.
  $html = $shell.Replace('{{TITLE}}', $slug).Replace('{{SLUG}}', $slug).Replace('{{MODE}}', $mode).Replace('{{SOURCE}}', $source)
  $html = $html.Replace('{{CSS}}', (Read-Text (Join-Path $assetsDir 'research.css')))
  $html = $html.Replace('{{JS}}', (Read-Text (Join-Path $assetsDir 'research.js')))
  $html = $html.Replace('{{SOURCES}}', $sources)
  [System.IO.File]::WriteAllText($out, $html, $utf8)
}

function Render-File([string] $path) {
  try {
    $rel = ($path -replace '\\', '/') -replace '^\./', ''
    $dir = Split-Path -Parent $rel
    if (-not $dir) { $dir = '.' }
    $assetsDir = Find-Assets $dir
    $name = Split-Path -Leaf $rel
    $base = [System.IO.Path]::GetFileNameWithoutExtension($name)
    if ($dir -eq '.') { $slug = $base } else { $slug = "$(Split-Path -Leaf $dir)-$base" }
    if ($name.EndsWith('.json')) { $mode = 'registry'; $type = 'application/json' }
    else { $mode = 'doc'; $type = 'text/markdown' }
    if ($dir -eq '.') { $out = "$base.html" } else { $out = "$dir/$base.html" }
    $full = (Resolve-Path -LiteralPath $rel).Path
    $outFull = Join-Path (Split-Path -Parent $full) "$base.html"
    Assemble $assetsDir $mode (Safe $slug) (Safe $rel) (Embed $full $type) $outFull
    Write-Output "rendered $rel -> $out"
    $script:rendered++
  } catch {
    [Console]::Error.WriteLine($_.Exception.Message)
    $script:status = 1
  }
}

function Render-Dir([string] $dir) {
  $d = $dir.TrimEnd('/', '\')
  if (-not (Test-Path -LiteralPath $d -PathType Container)) { return }
  if (Test-Path -LiteralPath "$d/registry.json" -PathType Leaf) { Render-File "$d/registry.json" }
  Get-ChildItem -LiteralPath $d -Filter '*.md' -File | Sort-Object Name | ForEach-Object {
    $f = "$d/$($_.Name)"
    if (Test-Doc $f) { Render-File $f }
  }
}

if ($All) {
  if (Test-Doc 'PLAN.md') { Render-File 'PLAN.md' }
  $dirs = @('notebook', 'experiments')
  foreach ($parent in 'experiments', 'specs') {
    if (Test-Path -LiteralPath $parent -PathType Container) {
      Get-ChildItem -LiteralPath $parent -Directory | Sort-Object Name | ForEach-Object { $dirs += "$parent/$($_.Name)" }
    }
  }
  $dirs += 'reports', 'docs'
  foreach ($d in $dirs) { Render-Dir $d }
  if ($script:rendered -eq 0) { [Console]::Error.WriteLine('nothing to render (run from the project root)') }
  exit $script:status
}

foreach ($path in $Paths) {
  if (Test-Path -LiteralPath $path -PathType Container) {
    Render-Dir $path
  } elseif (Test-Path -LiteralPath $path -PathType Leaf) {
    if ($path.EndsWith('.json')) { Render-File $path }
    elseif (Test-Doc $path) { Render-File $path }
    else { [Console]::Error.WriteLine("skip (no doc: frontmatter): $path") }
  } else {
    [Console]::Error.WriteLine("skip (not found): $path")
    $script:status = 1
  }
}
exit $script:status
