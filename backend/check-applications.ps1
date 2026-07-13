$files = @(
  "src/models/Application.model.js",
  "src/validators/application.validator.js",
  "src/middleware/uploadResume.js",
  "src/services/application.service.js",
  "src/controllers/application.controller.js",
  "src/routes/application.routes.js",
  "src/routes/index.js",
  "src/middleware/errorHandler.js"
)
$ok = $true
foreach ($f in $files) {
  $r = node --check $f 2>&1
  if ($LASTEXITCODE -ne 0) {
    Write-Host "FAIL: $f" -ForegroundColor Red
    Write-Host $r
    $ok = $false
  } else {
    Write-Host "OK:   $f" -ForegroundColor Green
  }
}
if ($ok) { Write-Host "`nALL MODULE 4 FILES: Syntax OK" -ForegroundColor Cyan }
else { exit 1 }
