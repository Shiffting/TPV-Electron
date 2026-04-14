# === Config ===
$ProjectDir = "C:\Users\emili\Desktop\TPV Final\Servidor"   # <- ajusta si es distinto
$EnvFile    = Join-Path $ProjectDir ".env"
$BackupDir  = "C:\Users\emili\Desktop\TPV Final\Servidor\backups"
$RetentionDays = 14

# Posibles rutas del mysqldump (MariaDB/MySQL)
$candidateDump = @(
  "C:\Program Files\MariaDB 11.4\bin\mysqldump.exe",
  "C:\Program Files\MariaDB 10.11\bin\mysqldump.exe",
  "C:\Program Files\MariaDB 10.6\bin\mysqldump.exe",
  "C:\Program Files\MySQL\MySQL Server 8.0\bin\mysqldump.exe",
  "mysqldump.exe"  # si está en PATH
)
$mysqldump = $candidateDump | Where-Object { Test-Path $_ } | Select-Object -First 1
if (-not $mysqldump) { Write-Error "No se encontró mysqldump. Ajusta la ruta en el script."; exit 1 }

# Leer .env (DB_HOST, DB_PORT, DB_NAME, DB_USER, DB_PASS, opcional)
if (-not (Test-Path $EnvFile)) { Write-Error ".env no encontrado en $ProjectDir"; exit 1 }

$envMap = @{}
Get-Content $EnvFile | ForEach-Object {
  if ($_ -match '^\s*#') { return }
  if ($_ -match '^\s*$') { return }
  $parts = $_ -split '=', 2
  if ($parts.Length -eq 2) {
    $key = $parts[0].Trim()
    $val = $parts[1].Trim().Trim('"').Trim("'")
    $envMap[$key] = $val
  }
}

$DB_HOST = $envMap["DB_HOST"]; if (-not $DB_HOST) { $DB_HOST = "127.0.0.1" }
$DB_PORT = $envMap["DB_PORT"]; if (-not $DB_PORT) { $DB_PORT = "3306" }
$DB_NAME = $envMap["DB_NAME"]; if (-not $DB_NAME) { $DB_NAME = "tpv" }
$DB_USER = $envMap["DB_USER"]; if (-not $DB_USER) { $DB_USER = "root" }
$DB_PASS = $envMap["DB_PASS"]; if (-not $DB_PASS) { Write-Error "DB_PASS no definido en .env"; exit 1 }

# Asegurar carpeta de destino
if (-not (Test-Path $BackupDir)) { New-Item -ItemType Directory -Path $BackupDir | Out-Null }

$ts = Get-Date -Format "yyyyMMdd_HHmmss"
$sqlFile = Join-Path $BackupDir "$($DB_NAME)_$ts.sql"
$zipFile = Join-Path $BackupDir "$($DB_NAME)_$ts.zip"

# Dump
$cmd = "`"$mysqldump`" --host=$DB_HOST --port=$DB_PORT --user=$DB_USER --password=$DB_PASS --single-transaction --routines --triggers --databases $DB_NAME > `"$sqlFile`""
cmd.exe /c $cmd
if ($LASTEXITCODE -ne 0 -or -not (Test-Path $sqlFile)) {
  Write-Error "Fallo en mysqldump"; exit 1
}

# --- Compresión más segura (sin conflictos) ---
Add-Type -AssemblyName System.IO.Compression.FileSystem
if (Test-Path $zipFile) { Remove-Item $zipFile -Force }
try {
    $zip = [System.IO.Compression.ZipFile]::Open($zipFile, 'Create')
    $entry = $zip.CreateEntry((Split-Path $sqlFile -Leaf))
    $inStream = [System.IO.File]::OpenRead($sqlFile)
    $outStream = $entry.Open()
    $inStream.CopyTo($outStream)
    $outStream.Dispose(); $inStream.Dispose()
    $zip.Dispose()
    Remove-Item $sqlFile -Force
    Write-Host "Backup OK -> $zipFile"
}
catch {
    Write-Error "Error al crear ZIP: $_"
}


# Retención
Get-ChildItem $BackupDir -Filter "$($DB_NAME)_*.zip" | Where-Object { $_.CreationTime -lt (Get-Date).AddDays(-$RetentionDays) } | Remove-Item -Force

Write-Host "Backup OK -> $zipFile"
