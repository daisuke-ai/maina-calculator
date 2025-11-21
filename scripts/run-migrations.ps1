# PowerShell script to run all Supabase migrations in order
# Usage: .\scripts\run-migrations.ps1

$ErrorActionPreference = "Stop"

# Load environment variables
$envPath = Join-Path $PSScriptRoot "..\..\.env.local"
if (Test-Path $envPath) {
    Get-Content $envPath | ForEach-Object {
        if ($_ -match '^([^=]+)=(.*)$') {
            [Environment]::SetEnvironmentVariable($matches[1], $matches[2])
        }
    }
}

$dbUrl = $env:SUPABASE_DB_URL

if (-not $dbUrl) {
    Write-Host "Error: SUPABASE_DB_URL not found in environment variables" -ForegroundColor Red
    Write-Host "Please set SUPABASE_DB_URL in your .env.local file" -ForegroundColor Yellow
    exit 1
}

Write-Host "Running Supabase migrations..." -ForegroundColor Green
Write-Host ""

$migrationsDir = Join-Path $PSScriptRoot "..\supabase\migrations"
$migrations = Get-ChildItem -Path $migrationsDir -Filter "*.sql" | Sort-Object Name

foreach ($migration in $migrations) {
    Write-Host "Running: $($migration.Name)" -ForegroundColor Cyan

    try {
        $output = psql $dbUrl -f $migration.FullName 2>&1

        if ($LASTEXITCODE -eq 0) {
            Write-Host "  ✓ Success" -ForegroundColor Green
        } else {
            Write-Host "  ✗ Failed" -ForegroundColor Red
            Write-Host $output -ForegroundColor Red
        }
    } catch {
        Write-Host "  ✗ Error: $_" -ForegroundColor Red
    }

    Write-Host ""
}

Write-Host "Migration process completed!" -ForegroundColor Green
