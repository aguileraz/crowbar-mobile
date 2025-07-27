#!/bin/bash

# Log Collector for Crowbar Mobile Testing
# Aggregates logs from multiple sources for debugging and analysis

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
LOGS_DIR="${LOGS_DIR:-/app/test-results/logs}"
MAX_LOG_SIZE="${MAX_LOG_SIZE:-10M}"
LOG_RETENTION_DAYS="${LOG_RETENTION_DAYS:-7}"
TIMESTAMP_FORMAT="%Y-%m-%d %H:%M:%S"

# Function to print colored output
log_info() {
    echo -e "${BLUE}[LOG-COLLECTOR]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Setup log directories
setup_log_dirs() {
    log_info "Setting up log directories..."
    
    mkdir -p "$LOGS_DIR"
    mkdir -p "$LOGS_DIR/android"
    mkdir -p "$LOGS_DIR/emulator"
    mkdir -p "$LOGS_DIR/tests"
    mkdir -p "$LOGS_DIR/build"
    mkdir -p "$LOGS_DIR/system"
    mkdir -p "$LOGS_DIR/processed"
    
    log_success "Log directories created"
}

# Get timestamp for log entries
get_timestamp() {
    date +"$TIMESTAMP_FORMAT"
}

# Collect Android device logs
collect_android_logs() {
    log_info "Collecting Android device logs..."
    
    local timestamp=$(date +%Y%m%d_%H%M%S)
    local output_dir="$LOGS_DIR/android"
    
    # Check if device is available
    if ! adb devices | grep -q "device$"; then
        log_warning "No Android device available for log collection"
        return 1
    fi
    
    # Collect logcat
    log_info "Collecting logcat..."
    adb logcat -d > "$output_dir/logcat_${timestamp}.log" 2>/dev/null || {
        log_error "Failed to collect logcat"
        return 1
    }
    
    # Collect system information
    log_info "Collecting system information..."
    {
        echo "=== Device Information ==="
        echo "Timestamp: $(get_timestamp)"
        echo "API Level: $(adb shell getprop ro.build.version.sdk 2>/dev/null)"
        echo "Device Model: $(adb shell getprop ro.product.model 2>/dev/null)"
        echo "Build ID: $(adb shell getprop ro.build.display.id 2>/dev/null)"
        echo "Android Version: $(adb shell getprop ro.build.version.release 2>/dev/null)"
        echo ""
        
        echo "=== Memory Information ==="
        adb shell dumpsys meminfo 2>/dev/null | head -20
        echo ""
        
        echo "=== CPU Information ==="
        adb shell dumpsys cpuinfo 2>/dev/null | head -20
        echo ""
        
        echo "=== Package Information ==="
        adb shell pm list packages | grep -E "(crowbar|test)" | head -10
        echo ""
        
        echo "=== Process Information ==="
        adb shell ps | grep -E "(crowbar|test)" | head -10
        echo ""
        
    } > "$output_dir/sysinfo_${timestamp}.log"
    
    # Collect app-specific logs
    log_info "Collecting app-specific logs..."
    adb logcat -d | grep -i "crowbar\|test\|error\|exception" > "$output_dir/app_logs_${timestamp}.log" 2>/dev/null || true
    
    # Collect crash logs
    log_info "Checking for crash logs..."
    adb shell ls /data/tombstones/ 2>/dev/null | while read tombstone; do
        if [ -n "$tombstone" ]; then
            adb shell cat "/data/tombstones/$tombstone" > "$output_dir/crash_${tombstone}_${timestamp}.log" 2>/dev/null || true
        fi
    done
    
    log_success "Android logs collected to $output_dir"
    return 0
}

# Collect emulator logs
collect_emulator_logs() {
    log_info "Collecting emulator logs..."
    
    local timestamp=$(date +%Y%m%d_%H%M%S)
    local output_dir="$LOGS_DIR/emulator"
    
    # Check for emulator process
    local emulator_pid=$(pgrep -f "emulator.*avd" | head -1)
    if [ -z "$emulator_pid" ]; then
        log_warning "No emulator process found"
        return 1
    fi
    
    # Collect emulator console output if available
    if [ -f "/tmp/emulator.log" ]; then
        cp "/tmp/emulator.log" "$output_dir/emulator_console_${timestamp}.log"
        log_info "Emulator console log collected"
    fi
    
    # Get emulator process information
    {
        echo "=== Emulator Process Information ==="
        echo "Timestamp: $(get_timestamp)"
        echo "PID: $emulator_pid"
        ps aux | grep "$emulator_pid" | head -1
        echo ""
        
        echo "=== Emulator Resources ==="
        top -p "$emulator_pid" -b -n 1 2>/dev/null || true
        echo ""
        
    } > "$output_dir/emulator_process_${timestamp}.log"
    
    log_success "Emulator logs collected to $output_dir"
    return 0
}

# Collect test execution logs
collect_test_logs() {
    log_info "Collecting test execution logs..."
    
    local timestamp=$(date +%Y%m%d_%H%M%S)
    local output_dir="$LOGS_DIR/tests"
    local test_results_dir="${1:-/app/test-results}"
    
    # Collect existing test logs
    for log_file in "$test_results_dir"/logs/*.log; do
        if [ -f "$log_file" ]; then
            local log_name=$(basename "$log_file" .log)
            cp "$log_file" "$output_dir/${log_name}_${timestamp}.log"
            log_info "Collected test log: $log_name"
        fi
    done
    
    # Collect npm/node logs if available
    if [ -f "$test_results_dir/npm-debug.log" ]; then
        cp "$test_results_dir/npm-debug.log" "$output_dir/npm_debug_${timestamp}.log"
    fi
    
    # Collect Jest logs
    for jest_log in "$test_results_dir"/**/jest*.log; do
        if [ -f "$jest_log" ]; then
            local log_name=$(basename "$jest_log" .log)
            cp "$jest_log" "$output_dir/${log_name}_${timestamp}.log"
        fi
    done
    
    # Collect Detox logs
    for detox_log in "$test_results_dir"/**/detox*.log; do
        if [ -f "$detox_log" ]; then
            local log_name=$(basename "$detox_log" .log)
            cp "$detox_log" "$output_dir/${log_name}_${timestamp}.log"
        fi
    done
    
    log_success "Test logs collected to $output_dir"
    return 0
}

# Collect build logs
collect_build_logs() {
    log_info "Collecting build logs..."
    
    local timestamp=$(date +%Y%m%d_%H%M%S)
    local output_dir="$LOGS_DIR/build"
    local project_dir="${1:-/app}"
    
    # Collect npm logs
    if [ -f "$project_dir/npm-debug.log" ]; then
        cp "$project_dir/npm-debug.log" "$output_dir/npm_debug_${timestamp}.log"
    fi
    
    # Collect yarn logs
    if [ -f "$project_dir/yarn-error.log" ]; then
        cp "$project_dir/yarn-error.log" "$output_dir/yarn_error_${timestamp}.log"
    fi
    
    # Collect React Native logs
    if [ -d "$project_dir/android/app/build/outputs/logs" ]; then
        cp -r "$project_dir/android/app/build/outputs/logs" "$output_dir/android_build_${timestamp}/"
    fi
    
    # Collect Metro bundler logs
    if [ -f "/tmp/metro.log" ]; then
        cp "/tmp/metro.log" "$output_dir/metro_${timestamp}.log"
    fi
    
    log_success "Build logs collected to $output_dir"
    return 0
}

# Collect system logs
collect_system_logs() {
    log_info "Collecting system logs..."
    
    local timestamp=$(date +%Y%m%d_%H%M%S)
    local output_dir="$LOGS_DIR/system"
    
    # Collect Docker logs if in container
    if [ -f /.dockerenv ]; then
        {
            echo "=== Docker Container Information ==="
            echo "Timestamp: $(get_timestamp)"
            cat /proc/1/cgroup 2>/dev/null | head -5
            echo ""
            
            echo "=== Container Resources ==="
            cat /proc/meminfo | grep -E "MemTotal|MemFree|MemAvailable" 2>/dev/null
            cat /proc/cpuinfo | grep -E "processor|model name" 2>/dev/null | head -5
            echo ""
            
            echo "=== Disk Usage ==="
            df -h 2>/dev/null
            echo ""
            
        } > "$output_dir/docker_info_${timestamp}.log"
    fi
    
    # Collect system resource usage
    {
        echo "=== System Resources ==="
        echo "Timestamp: $(get_timestamp)"
        
        echo "--- CPU Usage ---"
        top -b -n 1 | head -15 2>/dev/null || true
        echo ""
        
        echo "--- Memory Usage ---"
        free -h 2>/dev/null || true
        echo ""
        
        echo "--- Disk Usage ---"
        df -h 2>/dev/null || true
        echo ""
        
        echo "--- Network Interfaces ---"
        ip addr show 2>/dev/null | grep -E "inet|state" || ifconfig 2>/dev/null | grep -E "inet|flags" || true
        echo ""
        
    } > "$output_dir/resources_${timestamp}.log"
    
    # Collect environment information
    {
        echo "=== Environment Information ==="
        echo "Timestamp: $(get_timestamp)"
        echo "PATH: $PATH"
        echo "NODE_ENV: ${NODE_ENV:-not set}"
        echo "ANDROID_HOME: ${ANDROID_HOME:-not set}"
        echo "JAVA_HOME: ${JAVA_HOME:-not set}"
        echo ""
        
        echo "=== Process List ==="
        ps aux | grep -E "(node|java|emulator|adb)" | head -10
        echo ""
        
    } > "$output_dir/environment_${timestamp}.log"
    
    log_success "System logs collected to $output_dir"
    return 0
}

# Process and analyze logs
process_logs() {
    log_info "Processing and analyzing logs..."
    
    local timestamp=$(date +%Y%m%d_%H%M%S)
    local output_file="$LOGS_DIR/processed/analysis_${timestamp}.log"
    
    {
        echo "=== Log Analysis Report ==="
        echo "Generated: $(get_timestamp)"
        echo ""
        
        echo "=== Error Summary ==="
        echo "--- Android Errors ---"
        find "$LOGS_DIR/android" -name "*.log" -exec grep -i "error\|exception\|crash" {} \; 2>/dev/null | sort | uniq -c | sort -nr | head -10
        echo ""
        
        echo "--- Test Errors ---"
        find "$LOGS_DIR/tests" -name "*.log" -exec grep -i "error\|fail\|exception" {} \; 2>/dev/null | sort | uniq -c | sort -nr | head -10
        echo ""
        
        echo "=== Warning Summary ==="
        find "$LOGS_DIR" -name "*.log" -exec grep -i "warning\|warn" {} \; 2>/dev/null | sort | uniq -c | sort -nr | head -10
        echo ""
        
        echo "=== Performance Issues ==="
        find "$LOGS_DIR" -name "*.log" -exec grep -i "slow\|timeout\|memory\|performance" {} \; 2>/dev/null | sort | uniq -c | sort -nr | head -10
        echo ""
        
        echo "=== Log File Summary ==="
        find "$LOGS_DIR" -name "*.log" -exec ls -lh {} \; | awk '{print $5, $9}' | sort -k1 -hr
        echo ""
        
    } > "$output_file"
    
    log_success "Log analysis completed: $output_file"
}

# Create log summary
create_log_summary() {
    log_info "Creating log summary..."
    
    local summary_file="$LOGS_DIR/log_summary.json"
    local total_files=$(find "$LOGS_DIR" -name "*.log" | wc -l)
    local total_size=$(du -sh "$LOGS_DIR" 2>/dev/null | cut -f1)
    local error_count=$(find "$LOGS_DIR" -name "*.log" -exec grep -i "error" {} \; 2>/dev/null | wc -l)
    local warning_count=$(find "$LOGS_DIR" -name "*.log" -exec grep -i "warning" {} \; 2>/dev/null | wc -l)
    
    cat > "$summary_file" <<EOF
{
  "timestamp": "$(date -u +%Y-%m-%dT%H:%M:%SZ)",
  "summary": {
    "total_log_files": $total_files,
    "total_size": "$total_size",
    "error_count": $error_count,
    "warning_count": $warning_count
  },
  "categories": {
    "android": {
      "files": $(find "$LOGS_DIR/android" -name "*.log" 2>/dev/null | wc -l),
      "size": "$(du -sh "$LOGS_DIR/android" 2>/dev/null | cut -f1 || echo "0")"
    },
    "emulator": {
      "files": $(find "$LOGS_DIR/emulator" -name "*.log" 2>/dev/null | wc -l),
      "size": "$(du -sh "$LOGS_DIR/emulator" 2>/dev/null | cut -f1 || echo "0")"
    },
    "tests": {
      "files": $(find "$LOGS_DIR/tests" -name "*.log" 2>/dev/null | wc -l),
      "size": "$(du -sh "$LOGS_DIR/tests" 2>/dev/null | cut -f1 || echo "0")"
    },
    "build": {
      "files": $(find "$LOGS_DIR/build" -name "*.log" 2>/dev/null | wc -l),
      "size": "$(du -sh "$LOGS_DIR/build" 2>/dev/null | cut -f1 || echo "0")"
    },
    "system": {
      "files": $(find "$LOGS_DIR/system" -name "*.log" 2>/dev/null | wc -l),
      "size": "$(du -sh "$LOGS_DIR/system" 2>/dev/null | cut -f1 || echo "0")"
    }
  }
}
EOF
    
    log_success "Log summary created: $summary_file"
}

# Clean old logs
cleanup_old_logs() {
    local days="${1:-$LOG_RETENTION_DAYS}"
    
    log_info "Cleaning logs older than $days days..."
    
    # Find and remove old log files
    local removed_count=$(find "$LOGS_DIR" -name "*.log" -mtime +$days -delete -print 2>/dev/null | wc -l)
    
    log_success "Removed $removed_count old log files"
}

# Main function
main() {
    local action="${1:-collect}"
    shift
    
    case "$action" in
        setup)
            setup_log_dirs
            ;;
        collect)
            local target="${1:-all}"
            local project_dir="${2:-}"
            
            # Override LOGS_DIR if project directory is provided
            if [ -n "$project_dir" ]; then
                LOGS_DIR="$project_dir/logs"
            fi
            
            setup_log_dirs
            
            case "$target" in
                all)
                    collect_android_logs || true
                    collect_emulator_logs || true
                    collect_test_logs "$project_dir" || true
                    collect_build_logs "$project_dir" || true
                    collect_system_logs || true
                    process_logs
                    create_log_summary
                    ;;
                android)
                    collect_android_logs
                    ;;
                emulator)
                    collect_emulator_logs
                    ;;
                tests)
                    collect_test_logs "$project_dir"
                    ;;
                build)
                    collect_build_logs "$project_dir"
                    ;;
                system)
                    collect_system_logs
                    ;;
                *)
                    log_error "Unknown collection target: $target"
                    exit 1
                    ;;
            esac
            ;;
        process)
            process_logs
            ;;
        summary)
            create_log_summary
            ;;
        cleanup)
            cleanup_old_logs "$1"
            ;;
        *)
            echo "Usage: $0 {setup|collect|process|summary|cleanup} [options]"
            echo
            echo "Actions:"
            echo "  setup                           - Setup log directories"
            echo "  collect [target] [project_dir]  - Collect logs (targets: all, android, emulator, tests, build, system)"
            echo "  process                         - Process and analyze collected logs"
            echo "  summary                         - Create log summary JSON"
            echo "  cleanup [days]                  - Clean logs older than N days"
            echo
            echo "Environment Variables:"
            echo "  LOGS_DIR            - Output directory (default: /app/test-results/logs)"
            echo "  MAX_LOG_SIZE        - Maximum log file size (default: 10M)"
            echo "  LOG_RETENTION_DAYS  - Log retention period (default: 7)"
            exit 1
            ;;
    esac
}

# Run main function
main "$@"