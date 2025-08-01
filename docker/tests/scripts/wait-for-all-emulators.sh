#!/bin/bash
set -e

echo "⏳ Waiting for all emulators to be ready..."

# List of targets
TARGETS=("android-31" "android-26" "android-21")

# Wait for each emulator
for target in "${TARGETS[@]}"; do
    /app/scripts/wait-for-emulator.sh $target 300 &
done

# Wait for all background jobs
wait

echo "✅ All emulators are ready!"