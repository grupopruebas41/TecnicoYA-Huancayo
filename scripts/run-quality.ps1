param(
    [Parameter(Mandatory = $true)][string]$ScannerPath,
    [Parameter(Mandatory = $true)][string]$JavaHome
)

$ErrorActionPreference = 'Stop'
$projectRoot = Split-Path -Parent $PSScriptRoot
$localEnvironment = Join-Path $projectRoot 'infrastructure/.env.quality.local'
$tokenLine = Get-Content -LiteralPath $localEnvironment | Where-Object { $_ -match '^SONAR_TOKEN=' } | Select-Object -First 1
if (-not $tokenLine) { throw 'Primero inicializar SonarQube: falta el token de análisis local.' }
$token = $tokenLine.Substring('SONAR_TOKEN='.Length).Trim().Trim('"').Trim("'")
if (-not $token) { throw 'El token de análisis está vacío.' }
$scanner = (Resolve-Path -LiteralPath $ScannerPath).Path
$java = (Resolve-Path -LiteralPath $JavaHome).Path
$previousToken = $env:SONAR_TOKEN
$previousJava = $env:JAVA_HOME
$previousOpts = $env:SONAR_SCANNER_JAVA_OPTS
Push-Location $projectRoot
try {
    $env:SONAR_TOKEN = $token
    $env:JAVA_HOME = $java
    $env:SONAR_SCANNER_JAVA_OPTS = '-Xmx512m'
    & $scanner '-Dsonar.host.url=http://127.0.0.1:9000' '-Dsonar.working.directory=tmp/sonar-work' '-Dsonar.scanner.skipJreProvisioning=true' '-Dsonar.qualitygate.wait=true'
    $scannerExit = $LASTEXITCODE
} finally {
    $env:SONAR_TOKEN = $previousToken
    $env:JAVA_HOME = $previousJava
    $env:SONAR_SCANNER_JAVA_OPTS = $previousOpts
    $token = $null
    Pop-Location
}
exit $scannerExit
