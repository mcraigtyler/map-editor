param (
    [string]$ContainerName = "map-editor-db-1",
    [string]$DbUser = "postgres",
    [string]$DbName = "maped",

    [Alias("o")]
    [string]$Option,

    [Alias("c")]
    [string]$SqlCommand
)

# Define menu options (no Exit option)
$commands = @(
    @{ Key = "1"; Label = "List migrations"; Command = "SELECT * FROM migration;" },
    @{ Key = "2"; Label = "List schemas"; Command = "\dn" },
    @{ Key = "3"; Label = "List tables"; Command = "\dt" },
    @{ Key = "4"; Label = "Describe a table (prompt)"; Command = "__PROMPT__" }
    @{ Key = "5"; Label = "List users"; Command = "SELECT usename FROM pg_user;" },
    @{ Key = "6"; Label = "Show current database"; Command = "SELECT current_database();" },
    @{ Key = "7"; Label = "Show Postgres version"; Command = "SELECT version();" },
    @{ Key = "8"; Label = "Show database size"; Command = "SELECT pg_size_pretty(pg_database_size(current_database()));" },
    @{ Key = "9"; Label = "Show active connections"; Command = "SELECT pid, usename, application_name, state, query, backend_type FROM pg_stat_activity;" }
)

# Sort by numeric key
$sortedCommands = $commands | Sort-Object { [int]$_.Key }

function Show-Menu {
    Write-Host "PostgreSQL Command Menu:`n"
    foreach ($item in $sortedCommands) {
        Write-Host "$($item.Key). $($item.Label)"
    }
}

# If -c was provided, skip everything else
if ($SqlCommand) {
    Write-Host "`nRunning: $SqlCommand`n"
    & podman exec -it $ContainerName psql -U $DbUser -d $DbName -c "$SqlCommand"
    exit
}

# Interactive mode
if (-not $Option) {
    Show-Menu
    $Option = Read-Host "`nEnter a number to run the corresponding command"
}

# Exit if input is empty
if ([string]::IsNullOrWhiteSpace($Option)) {
    Write-Host "`nExiting..."
    exit
}

# Find the selected command
$selectedCmd = $sortedCommands | Where-Object { $_.Key -eq $Option }

# Run or handle invalid selection
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
    & podman exec -it $ContainerName psql -U $DbUser -d $DbName -c "$sqlCommand"
} else {
    Write-Host "`nInvalid selection. Please choose a valid menu option."
    Show-Menu
}
