#!/bin/bash

# =====================================================
# CROWBAR MOBILE - STORE SUBMISSION PREPARATION
# Version: 1.0.0
# Date: 2025-08-12
# Description: Prepare app for Google Play & App Store
# =====================================================

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
MAGENTA='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m'

# Configuration
APP_NAME="Crowbar"
BUNDLE_ID="com.crowbar.mobile"
VERSION_NAME="2.0.0"
VERSION_CODE=200
OUTPUT_DIR="store-submission"

print_header() {
    echo -e "\n${CYAN}========================================${NC}"
    echo -e "${CYAN}$1${NC}"
    echo -e "${CYAN}========================================${NC}\n"
}

print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

# Create output directory
create_directories() {
    print_header "📁 Creating Directory Structure"
    
    mkdir -p $OUTPUT_DIR/{android,ios,screenshots,metadata,certificates}
    mkdir -p $OUTPUT_DIR/screenshots/{android,ios}/{phone,tablet}
    mkdir -p $OUTPUT_DIR/metadata/{android,ios}
    
    print_success "Directory structure created"
}

# Generate screenshots
generate_screenshots() {
    print_header "📸 Generating Screenshots"
    
    # Android screenshots (required dimensions)
    print_info "Android Phone: 1080x1920"
    print_info "Android Tablet 7\": 1200x1920"
    print_info "Android Tablet 10\": 1600x2560"
    
    # iOS screenshots (required dimensions)
    print_info "iPhone 6.5\": 1242x2688"
    print_info "iPhone 5.5\": 1242x2208"
    print_info "iPad Pro 12.9\": 2048x2732"
    
    # Create placeholder screenshot info
    cat > $OUTPUT_DIR/screenshots/requirements.md << EOF
# Screenshot Requirements

## Android (Google Play)
- Minimum: 2 screenshots
- Maximum: 8 screenshots per device type
- Format: JPEG or PNG (no alpha)
- Phone: 1080x1920 or 1920x1080
- 7" tablet: 1200x1920 or 1920x1200  
- 10" tablet: 1600x2560 or 2560x1600

## iOS (App Store)
- Minimum: 1 screenshot per device size
- Maximum: 10 screenshots per device size
- Format: JPEG or PNG
- iPhone 6.5": 1242x2688
- iPhone 5.5": 1242x2208
- iPad Pro 12.9": 2048x2732
- iPad Pro 11": 1668x2388

## Screenshot Checklist
- [ ] Home screen with gamification elements
- [ ] Daily challenges screen
- [ ] Spin wheel in action
- [ ] Leaderboard with podium
- [ ] Box opening with special effects
- [ ] Streak tracker
- [ ] Flash sale with timer
- [ ] Profile with achievements
EOF
    
    print_success "Screenshot requirements documented"
}

# Prepare Android submission
prepare_android() {
    print_header "🤖 Preparing Android Submission"
    
    # Build release APK and AAB
    print_info "Building Android release..."
    cd android
    
    # Update version
    sed -i.bak "s/versionCode [0-9]*/versionCode $VERSION_CODE/" app/build.gradle
    sed -i.bak "s/versionName \".*\"/versionName \"$VERSION_NAME\"/" app/build.gradle
    
    # Build AAB for Play Store
    ./gradlew bundleRelease
    
    # Build APK for testing
    ./gradlew assembleRelease
    
    cd ..
    
    # Copy build artifacts
    cp android/app/build/outputs/bundle/release/*.aab $OUTPUT_DIR/android/
    cp android/app/build/outputs/apk/release/*.apk $OUTPUT_DIR/android/
    
    # Generate metadata
    cat > $OUTPUT_DIR/metadata/android/listing.json << EOF
{
  "title": "Crowbar - Caixas Misteriosas",
  "shortDescription": "O maior marketplace de caixas misteriosas do Brasil com sistema de recompensas!",
  "fullDescription": "$(cat store-assets/gamification-app-description.md | jq -Rs .)",
  "video": "",
  "category": "SHOPPING",
  "contentRating": "Teen",
  "email": "suporte@crowbar.com.br",
  "website": "https://crowbar.com.br",
  "privacy": "https://crowbar.com.br/privacy",
  "changelog": "• Sistema completo de gamificação\\n• Timers e ofertas relâmpago\\n• Desafios diários e semanais\\n• Ranking global\\n• Roda da sorte\\n• Correções de bugs"
}
EOF
    
    # Create release notes
    cat > $OUTPUT_DIR/metadata/android/release-notes.txt << EOF
Versão $VERSION_NAME - Gamificação Completa!

🎮 NOVO Sistema de Gamificação:
• Desafios diários com recompensas
• Sistema de streak com proteção
• Ranking global competitivo
• Roda da sorte com prêmios diários
• Níveis e XP

⚡ Ofertas Relâmpago:
• Timers com contagem regressiva
• Notificações de urgência
• Descontos exclusivos

✨ Melhorias:
• Performance otimizada
• Novos efeitos visuais
• Correções de bugs

Baixe agora e comece a ganhar!
EOF
    
    print_success "Android submission prepared"
}

# Prepare iOS submission
prepare_ios() {
    print_header "🍎 Preparing iOS Submission"
    
    if [[ "$OSTYPE" != "darwin"* ]]; then
        print_warning "iOS preparation requires macOS, skipping build..."
        
        # Create metadata anyway
        cat > $OUTPUT_DIR/metadata/ios/app-store-connect.json << EOF
{
  "bundleId": "$BUNDLE_ID",
  "appName": "$APP_NAME",
  "version": "$VERSION_NAME",
  "buildNumber": "$VERSION_CODE",
  "category": "SHOPPING",
  "primaryLanguage": "pt-BR",
  "description": {
    "pt-BR": {
      "name": "Crowbar - Caixas Misteriosas",
      "subtitle": "Abra, Ganhe, Surpreenda-se!",
      "keywords": "caixa misteriosa,mystery box,surpresa,marketplace,gamificação",
      "supportUrl": "https://crowbar.com.br/support",
      "marketingUrl": "https://crowbar.com.br",
      "privacyUrl": "https://crowbar.com.br/privacy"
    }
  }
}
EOF
        return
    fi
    
    # Update iOS version
    cd ios
    agvtool new-marketing-version $VERSION_NAME
    agvtool new-version -all $VERSION_CODE
    
    # Build archive
    xcodebuild -workspace CrowbarMobile.xcworkspace \
               -scheme CrowbarMobile \
               -configuration Release \
               -archivePath $PWD/../$OUTPUT_DIR/ios/CrowbarMobile.xcarchive \
               archive
    
    # Export IPA
    xcodebuild -exportArchive \
               -archivePath $PWD/../$OUTPUT_DIR/ios/CrowbarMobile.xcarchive \
               -exportOptionsPlist ExportOptions.plist \
               -exportPath $PWD/../$OUTPUT_DIR/ios
    
    cd ..
    
    print_success "iOS submission prepared"
}

# Validate submission
validate_submission() {
    print_header "✅ Validating Submission"
    
    # Check Android files
    if [ -f "$OUTPUT_DIR/android/*.aab" ]; then
        AAB_SIZE=$(du -h $OUTPUT_DIR/android/*.aab | cut -f1)
        print_success "Android AAB: $AAB_SIZE"
    else
        print_error "Android AAB not found"
    fi
    
    # Check iOS files
    if [ -f "$OUTPUT_DIR/ios/*.ipa" ]; then
        IPA_SIZE=$(du -h $OUTPUT_DIR/ios/*.ipa | cut -f1)
        print_success "iOS IPA: $IPA_SIZE"
    else
        print_warning "iOS IPA not found (requires macOS)"
    fi
    
    # Validate metadata
    if [ -f "$OUTPUT_DIR/metadata/android/listing.json" ]; then
        print_success "Android metadata ready"
    fi
    
    if [ -f "$OUTPUT_DIR/metadata/ios/app-store-connect.json" ]; then
        print_success "iOS metadata ready"
    fi
}

# Create submission checklist
create_checklist() {
    print_header "📋 Creating Submission Checklist"
    
    cat > $OUTPUT_DIR/SUBMISSION_CHECKLIST.md << EOF
# Store Submission Checklist

## ✅ Pre-Submission

### General
- [x] Version updated to $VERSION_NAME ($VERSION_CODE)
- [x] All gamification features tested
- [x] Performance optimized
- [x] Crashes fixed
- [ ] Legal review completed
- [ ] Privacy policy updated
- [ ] Terms of service updated

### Testing
- [ ] Unit tests passing
- [ ] E2E tests passing
- [ ] Manual testing on real devices
- [ ] Beta testing feedback incorporated
- [ ] Accessibility tested
- [ ] Different screen sizes tested

## 📱 Google Play Console

### Store Listing
- [ ] App name (30 chars)
- [ ] Short description (80 chars)
- [ ] Full description (4000 chars)
- [ ] App icon (512x512)
- [ ] Feature graphic (1024x500)
- [ ] Screenshots uploaded (min 2, max 8)
- [ ] App category selected
- [ ] Content rating questionnaire completed
- [ ] Target audience selected
- [ ] Privacy policy URL added
- [ ] App access instructions (if needed)

### Release Management
- [ ] Production track selected
- [ ] AAB uploaded
- [ ] Release notes added
- [ ] Rollout percentage (start with 10%)
- [ ] Update priority set
- [ ] In-app updates configured

### App Content
- [ ] Data safety form completed
- [ ] Ads declaration
- [ ] Permissions justified
- [ ] News apps policy (if applicable)
- [ ] COVID-19 apps policy (if applicable)

### Monetization
- [ ] Pricing configured (Free)
- [ ] Countries selected (Brazil first)
- [ ] In-app purchases configured (if any)
- [ ] Tax information provided

## 🍎 App Store Connect

### App Information
- [ ] App name
- [ ] Subtitle
- [ ] Privacy policy URL
- [ ] Category (Shopping)
- [ ] Age rating (12+)
- [ ] Copyright
- [ ] Trade representative (Brazil)

### Version Information
- [ ] What's New text
- [ ] Keywords (100 chars)
- [ ] Support URL
- [ ] Marketing URL
- [ ] Description
- [ ] Screenshots (all device sizes)
- [ ] App preview video (optional)

### App Review
- [ ] Contact information
- [ ] Demo account (if needed)
- [ ] Notes for reviewer
- [ ] Attachment (if needed)

### Release
- [ ] Version release (Manual/Automatic)
- [ ] Phased release (7 days recommended)
- [ ] Pre-order (if desired)

## 🚀 Post-Submission

### Monitoring
- [ ] Crash reports monitoring
- [ ] User reviews monitoring
- [ ] Performance metrics tracking
- [ ] Download statistics tracking

### Marketing
- [ ] Press release prepared
- [ ] Social media announcement
- [ ] Email campaign ready
- [ ] Influencer outreach
- [ ] ASO optimization ongoing

### Support
- [ ] Support team briefed
- [ ] FAQ updated
- [ ] Help documentation ready
- [ ] Feedback channels open

## 📊 Success Metrics

### Target KPIs (First Week)
- [ ] Downloads: 10,000+
- [ ] DAU: 3,000+
- [ ] Rating: 4.0+ stars
- [ ] Crash rate: <1%
- [ ] Retention D1: >50%
- [ ] Retention D7: >25%

### Gamification Metrics
- [ ] Challenge participation: >40%
- [ ] Spin wheel usage: >60%
- [ ] Streak users: >30%
- [ ] Timer conversion: >35%

---

Generated: $(date)
Version: $VERSION_NAME ($VERSION_CODE)
Status: Ready for submission
EOF
    
    print_success "Submission checklist created"
}

# Generate FastLane configuration
generate_fastlane() {
    print_header "🚀 Generating Fastlane Configuration"
    
    mkdir -p fastlane
    
    # Fastfile
    cat > fastlane/Fastfile << 'EOF'
default_platform(:android)

platform :android do
  desc "Deploy to Google Play Store"
  lane :deploy do
    gradle(
      task: "bundle",
      build_type: "Release"
    )
    upload_to_play_store(
      track: 'production',
      rollout: '0.1',
      skip_upload_apk: true,
      skip_upload_metadata: false,
      skip_upload_images: false,
      skip_upload_screenshots: false
    )
  end
end

platform :ios do
  desc "Deploy to App Store"
  lane :deploy do
    build_app(
      workspace: "ios/CrowbarMobile.xcworkspace",
      scheme: "CrowbarMobile",
      export_method: "app-store"
    )
    upload_to_app_store(
      force: true,
      automatic_release: false,
      submit_for_review: true,
      phased_release: true,
      skip_metadata: false,
      skip_screenshots: false
    )
  end
end
EOF
    
    # Appfile
    cat > fastlane/Appfile << EOF
# Android
json_key_file("google-play-key.json")
package_name("$BUNDLE_ID")

# iOS
app_identifier("$BUNDLE_ID")
apple_id("your-apple-id@example.com")
itc_team_id("your-team-id")
team_id("your-team-id")
EOF
    
    print_success "Fastlane configuration generated"
}

# Create marketing assets
create_marketing_assets() {
    print_header "🎨 Creating Marketing Assets"
    
    cat > $OUTPUT_DIR/MARKETING_ASSETS.md << EOF
# Marketing Assets Checklist

## Visual Assets Needed

### App Icon
- [ ] 512x512 (Google Play)
- [ ] 1024x1024 (App Store)
- [ ] Rounded corners version
- [ ] Square version

### Store Graphics
- [ ] Feature Graphic: 1024x500 (Google Play)
- [ ] Promotional Banner: 1024x500
- [ ] TV Banner: 1280x720 (if applicable)
- [ ] Wear OS: 512x512 (if applicable)

### Screenshots (8 designs)
1. [ ] Home - Mystery boxes grid
2. [ ] Gamification Hub - All features
3. [ ] Daily Challenges - Active challenges
4. [ ] Spin Wheel - Mid-spin action
5. [ ] Leaderboard - Top players podium
6. [ ] Box Opening - Special effects
7. [ ] Flash Sale - Timer urgency
8. [ ] Profile - Achievements & stats

### Social Media
- [ ] Instagram Posts (1080x1080)
- [ ] Instagram Stories (1080x1920)
- [ ] Facebook Cover (1200x630)
- [ ] Twitter Header (1500x500)
- [ ] LinkedIn Banner (1584x396)
- [ ] YouTube Thumbnail (1280x720)

### App Preview Video
- [ ] 15-30 seconds
- [ ] 1080x1920 (vertical)
- [ ] Show key features
- [ ] Include captions
- [ ] Background music
- [ ] Call to action

## Copy Needed

### Taglines
- Principal: "Abra, Ganhe, Surpreenda-se!"
- Secundário: "Cada caixa, uma aventura"
- Call to action: "Baixe agora e ganhe bônus"

### Press Release
- [ ] Headline
- [ ] Summary paragraph
- [ ] Features list
- [ ] Quotes
- [ ] About section
- [ ] Contact info

### Email Templates
- [ ] Launch announcement
- [ ] Feature highlights
- [ ] User testimonials
- [ ] Special offers

### Social Media Posts
- [ ] Launch post
- [ ] Feature posts (5)
- [ ] User stories
- [ ] Contests/giveaways

## Campaign Timeline

### Pre-Launch (1 week before)
- Teaser posts
- Email list announcement
- Press release to media
- Influencer outreach

### Launch Day
- Store release
- Social media blast
- Email campaign
- PR announcement

### Post-Launch (First week)
- Daily feature highlights
- User testimonials
- Contest announcement
- Engagement campaigns

### Ongoing
- Weekly challenges announcement
- Flash sales promotion
- Leaderboard updates
- Success stories
EOF
    
    print_success "Marketing assets checklist created"
}

# Main execution
main() {
    print_header "🚀 CROWBAR STORE SUBMISSION PREPARATION"
    echo -e "${MAGENTA}Version: $VERSION_NAME ($VERSION_CODE)${NC}"
    echo -e "${MAGENTA}Bundle ID: $BUNDLE_ID${NC}"
    
    create_directories
    generate_screenshots
    prepare_android
    prepare_ios
    create_checklist
    generate_fastlane
    create_marketing_assets
    validate_submission
    
    print_header "📊 SUBMISSION SUMMARY"
    
    # Summary
    echo -e "${CYAN}Output Directory:${NC} $OUTPUT_DIR/"
    echo -e "${CYAN}Android AAB:${NC} $OUTPUT_DIR/android/*.aab"
    echo -e "${CYAN}iOS IPA:${NC} $OUTPUT_DIR/ios/*.ipa"
    echo -e "${CYAN}Metadata:${NC} $OUTPUT_DIR/metadata/"
    echo -e "${CYAN}Checklist:${NC} $OUTPUT_DIR/SUBMISSION_CHECKLIST.md"
    
    print_header "✨ NEXT STEPS"
    echo "1. Review $OUTPUT_DIR/SUBMISSION_CHECKLIST.md"
    echo "2. Prepare screenshots as per requirements"
    echo "3. Complete metadata in store consoles"
    echo "4. Submit for review"
    echo ""
    print_success "Store submission preparation complete!"
    print_info "Good luck with your submission! 🚀"
}

# Run main function
main