# Builds atlas/expo-next1 for a DRAFT (alias) Netlify deploy:
# the live folder expo-live130, plus the new-brand website (apps/app/public-next) at the root,
# plus the new app and episodes (prototypes/greybox) under /hill. Production is never touched.
#   powershell -File prototypes/greybox/tools/stage-next.ps1 [-Live expo-live130] [-Out expo-next1]
# The repo root is found from this script's own folder (prototypes/greybox/tools -> three levels up).
param([string]$Live = "expo-live130", [string]$Out = "expo-next1")
$W = (Resolve-Path "$PSScriptRoot\..\..\..").Path
$S = "$W\atlas\$Out"
robocopy "$W\atlas\$Live" $S /MIR /NFL /NDL /NJH /NJS /XD .netlify | Out-Null
# new app + episodes, skipping backups, QA output and test configs
robocopy "$W\prototypes\greybox" "$S\hill" /E /NFL /NDL /NJH /NJS `
  /XF *.pre-*.html *.pre-*.js *.pre-*.mjs *.kb.mp4 *.slow.mp4 *.pre-b8.json `
  /XD qa qa-brand qa-drops qa-chat qa-community qa-films configs-test batches node_modules .netlify pre-repaint pre-fix wrong-repaint qa-cinema films qa-carry qa-repaint qa-four qa-remix approve small drip-drafts episodes.pre-remix-files tools strip-tmp _archive | Out-Null
# new-brand website (root pages, footer pages, art, redirects); skip its QA folder
robocopy "$W\apps\app\public-next" $S /E /NFL /NDL /NJH /NJS /XD _qa | Out-Null
Remove-Item -Recurse -Force "$S\.netlify" -ErrorAction SilentlyContinue
"staged: " + (Get-ChildItem $S -Recurse -File | Measure-Object Length -Sum | ForEach-Object { "{0} files, {1:N0} MB" -f $_.Count, ($_.Sum / 1MB) })
