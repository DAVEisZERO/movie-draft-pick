# Load the current Node version from nvm-windows
$nodeVersion = nvm list | Select-String '->' | ForEach-Object {
    ($_ -split '->')[1].Trim()
}

# Set the path to the correct Node version
$nodePath = "$env:APPDATA\nvm\$nodeVersion"
$env:PATH = "$nodePath;$nodePath\node_modules\npm\bin;$env:PATH"

# Run lint-staged
npm run lint
