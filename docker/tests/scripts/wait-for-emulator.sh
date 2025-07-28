#!/bin/bash
set -e

# Get target from argument
TARGET=${1:-android-31}
TIMEOUT=${2:-300}

echo "⏳ Waiting for $TARGET emulator to be ready..."

# Function to check if emulator is ready
check_emulator() {
    local host=$1
    local adb_port=$2
    
    # First check if we can connect to ADB
    if ! timeout 5 adb connect $host:$adb_port &>/dev/null; then
        return 1
    fi
    
    # Then check if device is online
    if ! adb -s $host:$adb_port shell getprop sys.boot_completed 2>/dev/null | grep -q "1"; then
        return 1
    fi
    
    return 0
}

# Port mappings
declare -A ADB_PORTS=(
    ["android-31"]="5555"
    ["android-26"]="5556"
    ["android-21"]="5558"
)

# Get port for target
ADB_PORT=${ADB_PORTS[$TARGET]}

if [ -z "$ADB_PORT" ]; then
    echo "❌ Unknown target: $TARGET"
    exit 1
fi

# Wait for emulator
elapsed=0
while [ $elapsed -lt $TIMEOUT ]; do
    if check_emulator $TARGET $ADB_PORT; then
        echo "✅ $TARGET emulator is ready!"
        
        # Additional wait for system to stabilize
        echo "⏳ Waiting for system to stabilize..."
        sleep 10
        
        exit 0
    fi
    
    sleep 5
    elapsed=$((elapsed + 5))
    echo "   Waiting... ($elapsed/$TIMEOUT seconds)"
done

echo "❌ $TARGET emulator failed to start within $TIMEOUT seconds"
exit 1