#!/bin/bash

# Artifact Packaging System for Crowbar Mobile
# Creates downloadable packages of test results for CI/CD and distribution

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
ARTIFACTS_DIR="${ARTIFACTS_DIR:-$RESULTS_DIR/artifacts}"
PACKAGE_NAME="${PACKAGE_NAME:-crowbar-mobile-test-results}"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
COMPRESSION_LEVEL="${COMPRESSION_LEVEL:-6}"

# Function to print colored output
log_info() {
    echo -e "${BLUE}[PACKAGER]${NC} $1"
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

# Setup artifacts directory
setup_artifacts_dir() {
    log_info "Setting up artifacts directory: $ARTIFACTS_DIR"
    
    mkdir -p "$ARTIFACTS_DIR"
    mkdir -p "$ARTIFACTS_DIR/packages"
    mkdir -p "$ARTIFACTS_DIR/manifests"
    mkdir -p "$ARTIFACTS_DIR/checksums"
    
    log_success "Artifacts directory ready"
}

# Create package manifest
create_manifest() {
    local package_name="$1"
    local package_path="$2"
    local manifest_file="$ARTIFACTS_DIR/manifests/${package_name}.manifest.json"
    
    log_info "Creating manifest for package: $package_name"
    
    # Calculate package info
    local package_size=$(ls -lh "$package_path" | awk '{print $5}')
    local package_size_bytes=$(stat -c%s "$package_path" 2>/dev/null || stat -f%z "$package_path" 2>/dev/null || echo "0")
    local checksum=$(sha256sum "$package_path" | cut -d' ' -f1)
    
    # Count contents
    local file_count=0
    local log_count=0
    local screenshot_count=0
    local json_count=0
    
    case "$package_name" in
        *complete*)
            file_count=$(find "$RESULTS_DIR" -type f | wc -l)
            log_count=$(find "$RESULTS_DIR" -name "*.log" | wc -l)
            screenshot_count=$(find "$RESULTS_DIR" -name "*.png" -o -name "*.jpg" | wc -l)
            json_count=$(find "$RESULTS_DIR" -name "*.json" | wc -l)
            ;;
        *logs*)
            file_count=$(find "$RESULTS_DIR/logs" -type f 2>/dev/null | wc -l)
            log_count=$file_count
            ;;
        *screenshots*)
            file_count=$(find "$RESULTS_DIR/screenshots" -type f 2>/dev/null | wc -l)
            screenshot_count=$file_count
            ;;
        *reports*)
            file_count=$(find "$RESULTS_DIR" -name "*.html" -o -name "*.json" -o -name "*.txt" | wc -l)
            json_count=$(find "$RESULTS_DIR" -name "*.json" | wc -l)
            ;;
    esac
    
    cat > "$manifest_file" <<EOF
{
  "package": {
    "name": "$package_name",
    "version": "1.0.0",
    "created_at": "$(date -u +%Y-%m-%dT%H:%M:%SZ)",
    "generator": "package-artifacts.sh"
  },
  "file": {
    "name": "$(basename "$package_path")",
    "path": "$package_path",
    "size_human": "$package_size",
    "size_bytes": $package_size_bytes,
    "checksum": {
      "algorithm": "sha256",
      "value": "$checksum"
    }
  },
  "contents": {
    "total_files": $file_count,
    "log_files": $log_count,
    "screenshot_files": $screenshot_count,
    "json_files": $json_count
  },
  "metadata": {
    "test_session": "$TIMESTAMP",
    "platform": "$(uname -s)",
    "architecture": "$(uname -m)",
    "docker": $([ -f /.dockerenv ] && echo "true" || echo "false")
  }
}
EOF
    
    log_success "Manifest created: $manifest_file"
    echo "$manifest_file"
}

# Create checksums file
create_checksums() {
    local checksums_file="$ARTIFACTS_DIR/checksums/SHA256SUMS"
    
    log_info "Generating checksums..."
    
    # Generate checksums for all packages
    (cd "$ARTIFACTS_DIR/packages" && sha256sum *.tar.gz *.zip 2>/dev/null > "$checksums_file") || {
        log_warning "No packages found for checksum generation"
        touch "$checksums_file"
    }
    
    if [ -s "$checksums_file" ]; then
        log_success "Checksums generated: $checksums_file"
    else
        log_warning "No checksums generated"
    fi
}

# Package complete test results
package_complete_results() {
    log_section "Creating Complete Results Package"
    
    local package_file="$ARTIFACTS_DIR/packages/${PACKAGE_NAME}_complete_${TIMESTAMP}.tar.gz"
    
    log_info "Packaging complete results to: $package_file"
    
    # Create tar archive with compression
    tar -czf "$package_file" \
        --exclude="$ARTIFACTS_DIR" \
        -C "$(dirname "$RESULTS_DIR")" \
        "$(basename "$RESULTS_DIR")" 2>/dev/null || {
        log_error "Failed to create complete package"
        return 1
    }
    
    local package_size=$(ls -lh "$package_file" | awk '{print $5}')
    log_success "Complete package created: $package_size"
    
    # Create manifest
    create_manifest "${PACKAGE_NAME}_complete_${TIMESTAMP}" "$package_file"
    
    echo "$package_file"
}

# Package logs only
package_logs() {
    log_section "Creating Logs Package"
    
    if [ ! -d "$RESULTS_DIR/logs" ] || [ -z "$(ls -A "$RESULTS_DIR/logs" 2>/dev/null)" ]; then
        log_warning "No logs directory or logs found, skipping logs package"
        return 0
    fi
    
    local package_file="$ARTIFACTS_DIR/packages/${PACKAGE_NAME}_logs_${TIMESTAMP}.tar.gz"
    
    log_info "Packaging logs to: $package_file"
    
    tar -czf "$package_file" -C "$RESULTS_DIR" logs/ 2>/dev/null || {
        log_error "Failed to create logs package"
        return 1
    }
    
    local package_size=$(ls -lh "$package_file" | awk '{print $5}')
    log_success "Logs package created: $package_size"
    
    # Create manifest
    create_manifest "${PACKAGE_NAME}_logs_${TIMESTAMP}" "$package_file"
    
    echo "$package_file"
}

# Package screenshots only
package_screenshots() {
    log_section "Creating Screenshots Package"
    
    if [ ! -d "$RESULTS_DIR/screenshots" ] || [ -z "$(ls -A "$RESULTS_DIR/screenshots" 2>/dev/null)" ]; then
        log_warning "No screenshots directory or screenshots found, skipping screenshots package"
        return 0
    fi
    
    local package_file="$ARTIFACTS_DIR/packages/${PACKAGE_NAME}_screenshots_${TIMESTAMP}.zip"
    
    log_info "Packaging screenshots to: $package_file"
    
    # Use zip for screenshots to preserve file structure and enable preview
    (cd "$RESULTS_DIR" && zip -r "$package_file" screenshots/ -q) || {
        log_error "Failed to create screenshots package"
        return 1
    }
    
    local package_size=$(ls -lh "$package_file" | awk '{print $5}')
    log_success "Screenshots package created: $package_size"
    
    # Create manifest
    create_manifest "${PACKAGE_NAME}_screenshots_${TIMESTAMP}" "$package_file"
    
    echo "$package_file"
}

# Package reports only
package_reports() {
    log_section "Creating Reports Package"
    
    local temp_dir=$(mktemp -d)
    local package_file="$ARTIFACTS_DIR/packages/${PACKAGE_NAME}_reports_${TIMESTAMP}.zip"
    
    log_info "Packaging reports to: $package_file"
    
    # Copy report files to temp directory
    mkdir -p "$temp_dir/reports"
    
    # Copy HTML reports
    find "$RESULTS_DIR" -name "*.html" -exec cp {} "$temp_dir/reports/" \; 2>/dev/null || true
    
    # Copy JSON reports
    find "$RESULTS_DIR" -name "*.json" -exec cp {} "$temp_dir/reports/" \; 2>/dev/null || true
    
    # Copy text summaries
    find "$RESULTS_DIR" -name "*.txt" -exec cp {} "$temp_dir/reports/" \; 2>/dev/null || true
    
    # Copy coverage reports if they exist
    if [ -d "$RESULTS_DIR/unit/coverage" ]; then
        cp -r "$RESULTS_DIR/unit/coverage" "$temp_dir/reports/unit_coverage/" 2>/dev/null || true
    fi
    
    if [ -d "$RESULTS_DIR/integration/coverage" ]; then
        cp -r "$RESULTS_DIR/integration/coverage" "$temp_dir/reports/integration_coverage/" 2>/dev/null || true
    fi
    
    # Create package
    (cd "$temp_dir" && zip -r "$package_file" reports/ -q) || {
        log_error "Failed to create reports package"
        rm -rf "$temp_dir"
        return 1
    }
    
    rm -rf "$temp_dir"
    
    local package_size=$(ls -lh "$package_file" | awk '{print $5}')
    log_success "Reports package created: $package_size"
    
    # Create manifest
    create_manifest "${PACKAGE_NAME}_reports_${TIMESTAMP}" "$package_file"
    
    echo "$package_file"
}

# Package for CI/CD (lightweight)
package_for_ci() {
    log_section "Creating CI/CD Package"
    
    local temp_dir=$(mktemp -d)
    local package_file="$ARTIFACTS_DIR/packages/${PACKAGE_NAME}_ci_${TIMESTAMP}.tar.gz"
    
    log_info "Creating lightweight CI/CD package: $package_file"
    
    # Copy essential files only
    mkdir -p "$temp_dir/ci"
    
    # Copy JSON summaries
    find "$RESULTS_DIR" -name "*.json" -maxdepth 1 -exec cp {} "$temp_dir/ci/" \; 2>/dev/null || true
    
    # Copy main HTML report
    [ -f "$RESULTS_DIR/enhanced-report.html" ] && cp "$RESULTS_DIR/enhanced-report.html" "$temp_dir/ci/"
    [ -f "$RESULTS_DIR/dashboard.html" ] && cp "$RESULTS_DIR/dashboard.html" "$temp_dir/ci/"
    
    # Copy test summary
    [ -f "$RESULTS_DIR/test-summary.txt" ] && cp "$RESULTS_DIR/test-summary.txt" "$temp_dir/ci/"
    
    # Copy a few key screenshots if available
    if [ -d "$RESULTS_DIR/screenshots/failures" ]; then
        mkdir -p "$temp_dir/ci/key_screenshots"
        find "$RESULTS_DIR/screenshots/failures" -name "*.png" | head -5 | while read screenshot; do
            [ -f "$screenshot" ] && cp "$screenshot" "$temp_dir/ci/key_screenshots/"
        done
    fi
    
    # Copy key logs (last 100 lines of each)
    if [ -d "$RESULTS_DIR/logs" ]; then
        mkdir -p "$temp_dir/ci/key_logs"
        for log_file in "$RESULTS_DIR/logs"/*.log; do
            if [ -f "$log_file" ]; then
                tail -100 "$log_file" > "$temp_dir/ci/key_logs/$(basename "$log_file")" 2>/dev/null || true
            fi
        done
    fi
    
    # Create package
    tar -czf "$package_file" -C "$temp_dir" ci/ 2>/dev/null || {
        log_error "Failed to create CI/CD package"
        rm -rf "$temp_dir"
        return 1
    }
    
    rm -rf "$temp_dir"
    
    local package_size=$(ls -lh "$package_file" | awk '{print $5}')
    log_success "CI/CD package created: $package_size"
    
    # Create manifest
    create_manifest "${PACKAGE_NAME}_ci_${TIMESTAMP}" "$package_file"
    
    echo "$package_file"
}

# Generate packaging summary
generate_packaging_summary() {
    log_section "Generating Packaging Summary"
    
    local summary_file="$ARTIFACTS_DIR/packaging_summary.json"
    local total_packages=$(find "$ARTIFACTS_DIR/packages" -name "*.tar.gz" -o -name "*.zip" | wc -l)
    local total_size=$(du -sh "$ARTIFACTS_DIR/packages" 2>/dev/null | cut -f1)
    
    cat > "$summary_file" <<EOF
{
  "summary": {
    "generated_at": "$(date -u +%Y-%m-%dT%H:%M:%SZ)",
    "session": "$TIMESTAMP",
    "total_packages": $total_packages,
    "total_size": "$total_size"
  },
  "packages": [
EOF
    
    # List all packages with their manifests
    local first=true
    for package in "$ARTIFACTS_DIR/packages"/*; do
        if [ -f "$package" ]; then
            local package_name=$(basename "$package")
            local manifest_file="$ARTIFACTS_DIR/manifests/${package_name%.*}.manifest.json"
            
            if [ "$first" = false ]; then
                echo "," >> "$summary_file"
            fi
            first=false
            
            if [ -f "$manifest_file" ]; then
                cat "$manifest_file" >> "$summary_file"
            else
                cat >> "$summary_file" <<EOF
    {
      "package": {
        "name": "$package_name",
        "created_at": "$(date -u +%Y-%m-%dT%H:%M:%SZ)"
      },
      "file": {
        "name": "$package_name",
        "path": "$package"
      }
    }
EOF
            fi
        fi
    done
    
    echo "  ]" >> "$summary_file"
    echo "}" >> "$summary_file"
    
    log_success "Packaging summary created: $summary_file"
}

# Create download index page
create_download_index() {
    log_section "Creating Download Index"
    
    local index_file="$ARTIFACTS_DIR/index.html"
    
    cat > "$index_file" <<EOF
<!DOCTYPE html>
<html>
<head>
    <title>Crowbar Mobile Test Artifacts</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 40px; background: #f5f5f5; }
        .container { max-width: 800px; margin: 0 auto; background: white; padding: 30px; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1); }
        h1 { color: #333; border-bottom: 2px solid #667eea; padding-bottom: 10px; }
        .package { background: #f8f9fa; padding: 20px; margin: 15px 0; border-radius: 6px; border-left: 4px solid #667eea; }
        .package h3 { margin-top: 0; color: #495057; }
        .download-btn { background: #667eea; color: white; padding: 8px 16px; text-decoration: none; border-radius: 4px; display: inline-block; margin: 5px 5px 5px 0; }
        .download-btn:hover { background: #5a6fd8; }
        .size { color: #6c757d; font-size: 0.9em; }
        .description { color: #6c757d; margin: 10px 0; }
        .timestamp { color: #6c757d; font-size: 0.8em; margin-top: 10px; }
    </style>
</head>
<body>
    <div class="container">
        <h1>Test Artifacts Download</h1>
        <p>Generated: $(date)</p>
        <p>Session: $TIMESTAMP</p>
        
EOF
    
    # Add packages
    for package in "$ARTIFACTS_DIR/packages"/*; do
        if [ -f "$package" ]; then
            local package_name=$(basename "$package")
            local package_size=$(ls -lh "$package" | awk '{print $5}')
            local description=""
            
            case "$package_name" in
                *complete*) description="Complete test results including all logs, screenshots, and reports" ;;
                *logs*) description="All test execution and system logs" ;;
                *screenshots*) description="Test screenshots and failure captures" ;;
                *reports*) description="HTML and JSON test reports with coverage data" ;;
                *ci*) description="Lightweight package for CI/CD systems" ;;
            esac
            
            cat >> "$index_file" <<EOF
        <div class="package">
            <h3>$package_name</h3>
            <div class="description">$description</div>
            <div class="size">Size: $package_size</div>
            <a href="packages/$package_name" class="download-btn">Download</a>
            <a href="manifests/${package_name%.*}.manifest.json" class="download-btn">Manifest</a>
        </div>
EOF
        fi
    done
    
    cat >> "$index_file" <<EOF
        
        <div class="package">
            <h3>Checksums</h3>
            <div class="description">SHA256 checksums for all packages</div>
            <a href="checksums/SHA256SUMS" class="download-btn">Download</a>
        </div>
        
        <div class="timestamp">
            Generated by package-artifacts.sh on $(date)
        </div>
    </div>
</body>
</html>
EOF
    
    log_success "Download index created: $index_file"
}

# Main packaging function
main() {
    local package_type="${1:-all}"
    
    log_section "Crowbar Mobile Artifact Packaging"
    log_info "Package type: $package_type"
    log_info "Results directory: $RESULTS_DIR"
    log_info "Artifacts directory: $ARTIFACTS_DIR"
    
    # Setup
    setup_artifacts_dir
    
    local packages_created=()
    
    # Create packages based on type
    case "$package_type" in
        all)
            packages_created+=($(package_complete_results))
            packages_created+=($(package_logs))
            packages_created+=($(package_screenshots))
            packages_created+=($(package_reports))
            packages_created+=($(package_for_ci))
            ;;
        complete)
            packages_created+=($(package_complete_results))
            ;;
        logs)
            packages_created+=($(package_logs))
            ;;
        screenshots)
            packages_created+=($(package_screenshots))
            ;;
        reports)
            packages_created+=($(package_reports))
            ;;
        ci)
            packages_created+=($(package_for_ci))
            ;;
        *)
            log_error "Unknown package type: $package_type"
            exit 1
            ;;
    esac
    
    # Generate supporting files
    create_checksums
    generate_packaging_summary
    create_download_index
    
    # Summary
    log_section "Packaging Complete"
    log_success "Created ${#packages_created[@]} package(s)"
    
    for package in "${packages_created[@]}"; do
        if [ -n "$package" ] && [ -f "$package" ]; then
            local size=$(ls -lh "$package" | awk '{print $5}')
            log_info "  $(basename "$package") - $size"
        fi
    done
    
    log_info "Download index: $ARTIFACTS_DIR/index.html"
    log_info "Packaging summary: $ARTIFACTS_DIR/packaging_summary.json"
    
    echo
    echo "Artifacts ready for distribution!"
}

# Handle command line arguments
case "${1:-all}" in
    all|complete|logs|screenshots|reports|ci)
        main "$1"
        ;;
    --help)
        echo "Usage: $0 [package_type]"
        echo
        echo "Package Types:"
        echo "  all          - Create all package types (default)"
        echo "  complete     - Complete test results archive"
        echo "  logs         - Logs only package"
        echo "  screenshots  - Screenshots only package"
        echo "  reports      - Reports only package"
        echo "  ci           - Lightweight CI/CD package"
        echo
        echo "Environment Variables:"
        echo "  RESULTS_DIR     - Source directory (default: /app/test-results)"
        echo "  ARTIFACTS_DIR   - Output directory (default: RESULTS_DIR/artifacts)"
        echo "  PACKAGE_NAME    - Package name prefix (default: crowbar-mobile-test-results)"
        exit 0
        ;;
    *)
        log_error "Unknown package type: $1"
        echo "Use --help for usage information"
        exit 1
        ;;
esac