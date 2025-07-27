#!/bin/bash

# Results Collector for Crowbar Mobile Testing
# Orchestrates collection of all test results, logs, screenshots, and artifacts

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Configuration
RESULTS_DIR="${RESULTS_DIR:-/app/test-results}"
SCHEMA_VERSION="1.0.0"
COLLECTOR_VERSION="1.0.0"

# Function to print colored output
log_info() {
    echo -e "${BLUE}[COLLECTOR]${NC} $1"
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

log_section() {
    echo -e "\n${CYAN}==== $1 ====${NC}\n"
}

# Initialize results collection
initialize_collection() {
    log_section "Initializing Results Collection"
    
    log_info "Results directory: $RESULTS_DIR"
    log_info "Schema version: $SCHEMA_VERSION"
    log_info "Collector version: $COLLECTOR_VERSION"
    
    # Ensure all directories exist
    mkdir -p "$RESULTS_DIR"
    mkdir -p "$RESULTS_DIR/raw"
    mkdir -p "$RESULTS_DIR/processed"
    mkdir -p "$RESULTS_DIR/artifacts"
    
    # Create collection metadata
    cat > "$RESULTS_DIR/collection_metadata.json" <<EOF
{
  "schema_version": "$SCHEMA_VERSION",
  "collector_version": "$COLLECTOR_VERSION",
  "collection_start": "$(date -u +%Y-%m-%dT%H:%M:%SZ)",
  "environment": {
    "platform": "$(uname -s)",
    "architecture": "$(uname -m)",
    "docker": $([ -f /.dockerenv ] && echo "true" || echo "false"),
    "ci": $([ -n "$CI" ] && echo "true" || echo "false")
  }
}
EOF
    
    log_success "Collection initialized"
}

# Collect test results
collect_test_results() {
    log_section "Collecting Test Results"
    
    local test_results_collected=0
    
    # Collect unit test results
    if [ -f "$RESULTS_DIR/unit/results.json" ]; then
        cp "$RESULTS_DIR/unit/results.json" "$RESULTS_DIR/raw/unit_results.json"
        log_info "Unit test results collected"
        ((test_results_collected++)) || true
    fi
    
    # Collect integration test results
    if [ -f "$RESULTS_DIR/integration/results.json" ]; then
        cp "$RESULTS_DIR/integration/results.json" "$RESULTS_DIR/raw/integration_results.json"
        log_info "Integration test results collected"
        ((test_results_collected++)) || true
    fi
    
    # Collect E2E test results
    if [ -f "$RESULTS_DIR/e2e/detox-results.json" ]; then
        cp "$RESULTS_DIR/e2e/detox-results.json" "$RESULTS_DIR/raw/e2e_results.json"
        log_info "E2E test results collected"
        ((test_results_collected++)) || true
    fi
    
    # Collect aggregated results
    if [ -f "$RESULTS_DIR/aggregated-report.json" ]; then
        cp "$RESULTS_DIR/aggregated-report.json" "$RESULTS_DIR/raw/aggregated_results.json"
        log_info "Aggregated results collected"
    fi
    
    log_success "Collected $test_results_collected test result files"
}

# Collect logs
collect_logs() {
    log_section "Collecting Logs"
    
    # Run log collector
    if [ -f "$(dirname "$0")/log-collector.sh" ]; then
        "$(dirname "$0")/log-collector.sh" collect all "$RESULTS_DIR" || {
            log_warning "Log collection encountered errors"
        }
        log_success "Logs collected via log-collector.sh"
    else
        log_warning "log-collector.sh not found, collecting basic logs"
        
        # Fallback: collect basic logs manually
        mkdir -p "$RESULTS_DIR/logs"
        
        # Collect test logs
        find "$RESULTS_DIR" -name "*.log" -exec cp {} "$RESULTS_DIR/logs/" \; 2>/dev/null || true
        
        # Collect Android logs if available
        if adb devices | grep -q "device$"; then
            adb logcat -d > "$RESULTS_DIR/logs/logcat_$(date +%Y%m%d_%H%M%S).log" 2>/dev/null || true
        fi
    fi
}

# Collect screenshots
collect_screenshots() {
    log_section "Collecting Screenshots"
    
    # Ensure screenshots directory exists
    mkdir -p "$RESULTS_DIR/screenshots"
    
    # Run screenshot collector if available
    if [ -f "$(dirname "$0")/screenshot-capture.sh" ]; then
        export SCREENSHOTS_DIR="$RESULTS_DIR/screenshots"
        "$(dirname "$0")/screenshot-capture.sh" setup
        "$(dirname "$0")/screenshot-capture.sh" gallery
        log_success "Screenshots processed via screenshot-capture.sh"
    else
        log_warning "screenshot-capture.sh not found"
    fi
    
    # Count screenshots
    local screenshot_count=$(find "$RESULTS_DIR/screenshots" -name "*.png" -o -name "*.jpg" | wc -l)
    log_info "Found $screenshot_count screenshot files"
}

# Generate standardized JSON summary
generate_json_summary() {
    log_section "Generating Standardized JSON Summary"
    
    local summary_file="$RESULTS_DIR/test_results_summary.json"
    local start_time=$(date -u +%Y-%m-%dT%H:%M:%SZ)
    
    # Load existing data
    local unit_data="{}"
    local integration_data="{}"
    local e2e_data="{}"
    local aggregated_data="{}"
    
    if [ -f "$RESULTS_DIR/raw/unit_results.json" ]; then
        unit_data=$(cat "$RESULTS_DIR/raw/unit_results.json")
    fi
    
    if [ -f "$RESULTS_DIR/raw/integration_results.json" ]; then
        integration_data=$(cat "$RESULTS_DIR/raw/integration_results.json")
    fi
    
    if [ -f "$RESULTS_DIR/raw/e2e_results.json" ]; then
        e2e_data=$(cat "$RESULTS_DIR/raw/e2e_results.json")
    fi
    
    if [ -f "$RESULTS_DIR/raw/aggregated_results.json" ]; then
        aggregated_data=$(cat "$RESULTS_DIR/raw/aggregated_results.json")
    fi
    
    # Count artifacts
    local log_count=$(find "$RESULTS_DIR/logs" -name "*.log" 2>/dev/null | wc -l)
    local screenshot_count=$(find "$RESULTS_DIR/screenshots" -name "*.png" -o -name "*.jpg" 2>/dev/null | wc -l)
    local total_size=$(du -sh "$RESULTS_DIR" 2>/dev/null | cut -f1)
    
    # Create standardized summary
    cat > "$summary_file" <<EOF
{
  "schema": {
    "version": "$SCHEMA_VERSION",
    "format": "crowbar-mobile-test-results",
    "specification": "https://github.com/crowbar/test-results-schema"
  },
  "metadata": {
    "generated_at": "$start_time",
    "generator": {
      "name": "collect-results.sh",
      "version": "$COLLECTOR_VERSION"
    },
    "environment": {
      "platform": "$(uname -s)",
      "architecture": "$(uname -m)",
      "docker": $([ -f /.dockerenv ] && echo "true" || echo "false"),
      "ci": $([ -n "$CI" ] && echo "true" || echo "false"),
      "android_api": "$(adb shell getprop ro.build.version.sdk 2>/dev/null || echo "null")",
      "node_version": "$(node --version 2>/dev/null || echo "null")"
    }
  },
  "summary": {
EOF
    
    # Add summary statistics using jq if available
    if command -v jq &> /dev/null && [ -f "$RESULTS_DIR/raw/aggregated_results.json" ]; then
        jq -r '.summary | 
          "    \"total_tests\": \(.total_tests // 0),",
          "    \"passed\": \(.passed // 0),",
          "    \"failed\": \(.failed // 0),",
          "    \"skipped\": \(.skipped // 0),",
          "    \"pass_rate\": \(.pass_rate // 0),",
          "    \"duration_ms\": \(.duration // 0),"' "$RESULTS_DIR/raw/aggregated_results.json" >> "$summary_file"
    else
        cat >> "$summary_file" <<EOF
    "total_tests": 0,
    "passed": 0,
    "failed": 0,
    "skipped": 0,
    "pass_rate": 0,
    "duration_ms": 0,
EOF
    fi
    
    cat >> "$summary_file" <<EOF
    "test_suites": {
      "unit": $([ -f "$RESULTS_DIR/raw/unit_results.json" ] && echo "true" || echo "false"),
      "integration": $([ -f "$RESULTS_DIR/raw/integration_results.json" ] && echo "true" || echo "false"),
      "e2e": $([ -f "$RESULTS_DIR/raw/e2e_results.json" ] && echo "true" || echo "false")
    }
  },
  "test_results": {
EOF
    
    # Add detailed test results if jq is available
    if command -v jq &> /dev/null; then
        echo '    "unit": ' >> "$summary_file"
        if [ -f "$RESULTS_DIR/raw/unit_results.json" ]; then
            jq '.' "$RESULTS_DIR/raw/unit_results.json" >> "$summary_file"
        else
            echo "null" >> "$summary_file"
        fi
        echo '    ,' >> "$summary_file"
        
        echo '    "integration": ' >> "$summary_file"
        if [ -f "$RESULTS_DIR/raw/integration_results.json" ]; then
            jq '.' "$RESULTS_DIR/raw/integration_results.json" >> "$summary_file"
        else
            echo "null" >> "$summary_file"
        fi
        echo '    ,' >> "$summary_file"
        
        echo '    "e2e": ' >> "$summary_file"
        if [ -f "$RESULTS_DIR/raw/e2e_results.json" ]; then
            jq '.' "$RESULTS_DIR/raw/e2e_results.json" >> "$summary_file"
        else
            echo "null" >> "$summary_file"
        fi
    else
        cat >> "$summary_file" <<EOF
    "unit": null,
    "integration": null,
    "e2e": null
EOF
    fi
    
    cat >> "$summary_file" <<EOF
  },
  "coverage": {
EOF
    
    # Add coverage data if available
    if command -v jq &> /dev/null && [ -f "$RESULTS_DIR/raw/aggregated_results.json" ]; then
        jq -r '.coverage // {} | 
          "    \"lines\": \(.lines // 0),",
          "    \"branches\": \(.branches // 0),",
          "    \"functions\": \(.functions // 0),",
          "    \"statements\": \(.statements // 0)"' "$RESULTS_DIR/raw/aggregated_results.json" >> "$summary_file"
    else
        cat >> "$summary_file" <<EOF
    "lines": 0,
    "branches": 0,
    "functions": 0,
    "statements": 0
EOF
    fi
    
    cat >> "$summary_file" <<EOF
  },
  "artifacts": {
    "logs": {
      "count": $log_count,
      "location": "logs/"
    },
    "screenshots": {
      "count": $screenshot_count,
      "location": "screenshots/"
    },
    "reports": {
      "html": "enhanced-report.html",
      "json": "aggregated-report.json",
      "text": "test-summary.txt"
    },
    "total_size": "$total_size"
  },
  "quality_gates": {
    "pass_rate_threshold": 80,
    "coverage_threshold": 80,
    "max_failed_tests": 5,
    "status": "$([ -f "$RESULTS_DIR/raw/aggregated_results.json" ] && {
      if command -v jq &> /dev/null; then
        local failed=$(jq -r '.summary.failed // 0' "$RESULTS_DIR/raw/aggregated_results.json")
        local pass_rate=$(jq -r '.summary.pass_rate // 0' "$RESULTS_DIR/raw/aggregated_results.json")
        local pass_check=$(awk "BEGIN {print ($pass_rate >= 80) ? 1 : 0}")
        if [ "$failed" -le 5 ] && [ "$pass_check" -eq 1 ]; then
          echo "PASS"
        else
          echo "FAIL"
        fi
      else
        echo "UNKNOWN"
      fi
    } || echo "UNKNOWN")"
  }
}
EOF
    
    log_success "Standardized JSON summary generated: $summary_file"
}

# Generate enhanced HTML report
generate_enhanced_report() {
    log_section "Generating Enhanced HTML Report"
    
    if [ -f "$(dirname "$0")/generate-html-report.sh" ]; then
        "$(dirname "$0")/generate-html-report.sh" "$RESULTS_DIR" "$RESULTS_DIR/enhanced-report.html" "$RESULTS_DIR/test_results_summary.json"
        log_success "Enhanced HTML report generated"
    else
        log_warning "generate-html-report.sh not found, skipping HTML report"
    fi
}

# Validate collection completeness
validate_collection() {
    log_section "Validating Collection Completeness"
    
    local validation_errors=0
    
    # Check required files
    local required_files=(
        "collection_metadata.json"
        "test_results_summary.json"
    )
    
    for file in "${required_files[@]}"; do
        if [ ! -f "$RESULTS_DIR/$file" ]; then
            log_error "Missing required file: $file"
            ((validation_errors++))
        else
            log_info "✓ Found: $file"
        fi
    done
    
    # Check JSON validity
    if command -v jq &> /dev/null; then
        for json_file in "$RESULTS_DIR"/*.json; do
            if [ -f "$json_file" ]; then
                if jq . "$json_file" &> /dev/null; then
                    log_info "✓ Valid JSON: $(basename "$json_file")"
                else
                    log_error "Invalid JSON: $(basename "$json_file")"
                    ((validation_errors++))
                fi
            fi
        done
    fi
    
    # Check directory structure
    local expected_dirs=("raw" "processed" "artifacts" "logs" "screenshots")
    for dir in "${expected_dirs[@]}"; do
        if [ -d "$RESULTS_DIR/$dir" ]; then
            log_info "✓ Directory exists: $dir"
        else
            log_warning "Missing directory: $dir"
        fi
    done
    
    if [ $validation_errors -eq 0 ]; then
        log_success "Collection validation passed"
        return 0
    else
        log_error "Collection validation failed with $validation_errors errors"
        return 1
    fi
}

# Update collection metadata
finalize_collection() {
    log_section "Finalizing Collection"
    
    local end_time=$(date -u +%Y-%m-%dT%H:%M:%SZ)
    
    # Update metadata with completion info
    if command -v jq &> /dev/null && [ -f "$RESULTS_DIR/collection_metadata.json" ]; then
        jq ". + {
          \"collection_end\": \"$end_time\",
          \"status\": \"completed\",
          \"validation\": \"$(validate_collection &> /dev/null && echo "passed" || echo "failed")\"
        }" "$RESULTS_DIR/collection_metadata.json" > "$RESULTS_DIR/collection_metadata.tmp" && \
        mv "$RESULTS_DIR/collection_metadata.tmp" "$RESULTS_DIR/collection_metadata.json"
    fi
    
    log_success "Collection finalized at $end_time"
}

# Main collection orchestration
main() {
    local start_time=$(date +%s)
    
    log_section "Crowbar Mobile Results Collection"
    log_info "Starting comprehensive results collection..."
    
    # Initialize
    initialize_collection
    
    # Collect all components
    collect_test_results
    collect_logs
    collect_screenshots
    
    # Generate reports
    generate_json_summary
    generate_enhanced_report
    
    # Validate and finalize
    validate_collection
    finalize_collection
    
    # Summary
    local end_time=$(date +%s)
    local duration=$((end_time - start_time))
    
    log_section "Collection Summary"
    log_success "Results collection completed in ${duration}s"
    log_info "Output directory: $RESULTS_DIR"
    log_info "Summary file: $RESULTS_DIR/test_results_summary.json"
    log_info "HTML report: $RESULTS_DIR/enhanced-report.html"
    
    # Display file counts
    local total_files=$(find "$RESULTS_DIR" -type f | wc -l)
    local total_size=$(du -sh "$RESULTS_DIR" 2>/dev/null | cut -f1)
    
    echo
    echo "Artifacts collected:"
    echo "  Total files: $total_files"
    echo "  Total size: $total_size"
    echo "  JSON results: $(find "$RESULTS_DIR" -name "*.json" | wc -l)"
    echo "  Log files: $(find "$RESULTS_DIR" -name "*.log" 2>/dev/null | wc -l)"
    echo "  Screenshots: $(find "$RESULTS_DIR" -name "*.png" -o -name "*.jpg" 2>/dev/null | wc -l)"
    echo
}

# Handle command line arguments
case "${1:-collect}" in
    collect|all)
        main
        ;;
    init|initialize)
        initialize_collection
        ;;
    test-results)
        collect_test_results
        ;;
    logs)
        collect_logs
        ;;
    screenshots)
        collect_screenshots
        ;;
    summary)
        generate_json_summary
        ;;
    report)
        generate_enhanced_report
        ;;
    validate)
        validate_collection
        ;;
    --help)
        echo "Usage: $0 [action]"
        echo
        echo "Actions:"
        echo "  collect        - Full collection (default)"
        echo "  init           - Initialize collection directories"
        echo "  test-results   - Collect test results only"
        echo "  logs           - Collect logs only"
        echo "  screenshots    - Collect screenshots only"
        echo "  summary        - Generate JSON summary only"
        echo "  report         - Generate HTML report only"
        echo "  validate       - Validate collection completeness"
        echo
        echo "Environment Variables:"
        echo "  RESULTS_DIR    - Output directory (default: /app/test-results)"
        exit 0
        ;;
    *)
        log_error "Unknown action: $1"
        echo "Use --help for usage information"
        exit 1
        ;;
esac