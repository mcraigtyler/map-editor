param (
    [string]$ContainerName = "map-editor-db-1",
    [string]$DbUser = "postgres",
    [string]$DbName = "maped",

    [Alias("o")]
    [string]$Option,

    [Alias("c")]
    [string]$SqlCommand
)

$commands = @(
    @{ Key = "1"; Label = "List migrations"; Command = "SELECT * FROM migration;" },
    @{ Key = "2"; Label = "List schemas"; Command = "\dn" },
    @{ Key = "3"; Label = "List tables"; Command = "\dt" },
    @{ Key = "4"; Label = "Describe a table (prompt)"; Command = "__PROMPT__" },
    @{ Key = "5"; Label = "List users"; Command = "SELECT usename FROM pg_user;" },
    @{ Key = "6"; Label = "Show current database"; Command = "SELECT current_database();" },
    @{ Key = "7"; Label = "Show Postgres version"; Command = "SELECT version();" },
    @{ Key = "8"; Label = "Show database size"; Command = "SELECT pg_size_pretty(pg_database_size(current_database()));" },
    @{ Key = "9"; Label = "Show active connections"; Command = "SELECT pid, usename, application_name, state, query, backend_type FROM pg_stat_activity;" }
)

$sortedCommands = $commands | Sort-Object { [int]$_.Key }

# Determine container runtime (prefer Docker, then Podman)
$containerExecutable = $null
if (Get-Command -Name docker -ErrorAction SilentlyContinue) {
    $containerExecutable = "docker"
} elseif (Get-Command -Name podman -ErrorAction SilentlyContinue) {
    $containerExecutable = "podman"
} else {
    Write-Error "Neither Docker nor Podman is installed. Please install one of them before running this script."
    exit 1
}

function Invoke-ContainerPsql {
    param (
        [string]$Query
    )

    $args = @("exec", "-it", $ContainerName, "psql", "-U", $DbUser, "-d", $DbName, "-c", $Query)
    & $containerExecutable @args
}

function Show-Menu {
    Write-Host "PostgreSQL Command Menu:`n"
    foreach ($item in $sortedCommands) {
        Write-Host "$($item.Key). $($item.Label)"
    }
}

if ($SqlCommand) {
    Write-Host "`nRunning: $SqlCommand`n"
    Invoke-ContainerPsql -Query $SqlCommand
    exit
}

if (-not $Option) {
    Show-Menu
    $Option = Read-Host "`nEnter a number to run the corresponding command"
}

if ([string]::IsNullOrWhiteSpace($Option)) {
    Write-Host "`nExiting..."
    exit
}

$selectedCmd = $sortedCommands | Where-Object { $_.Key -eq $Option }

if ($null -ne $selectedCmd) {
    if ($selectedCmd.Command -eq "__PROMPT__") {
        $tableName = Read-Host "Enter the table name to describe"
        if ([string]::IsNullOrWhiteSpace($tableName)) {
            Write-Host "No table name provided. Exiting..."
            exit
        }
        $sqlCommand = "\d $tableName"
    } else {
        $sqlCommand = $selectedCmd.Command
    }
    Write-Host "`nRunning: $sqlCommand`n"
    Invoke-ContainerPsql -Query $sqlCommand
} else {
    Write-Host "`nInvalid selection. Please choose a valid menu option."
    Show-Menu
}
