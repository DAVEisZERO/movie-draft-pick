
# Load NVM (only works in Unix-like environments; nvm-windows doesn't use this)
# This part is skipped in Windows since nvm-windows doesn't use shell sourcing

# Get the active Node version from nvm-windows
$nvmList = nvm list
$activeLine = $nvmList | Where-Object { $_ -match '->' }
$nodeVersion = ($activeLine -split '->')[1].Trim()

# Set PATH to use the correct Node version
$nodePath = "$env:APPDATA\nvm\$nodeVersion"
$env:PATH = "$nodePath;$nodePath\node_modules\npm\bin;$env:PATH"

# Run commitlint with the commit message file passed as argument
npx --no -- commitlint --edit $args[0]
