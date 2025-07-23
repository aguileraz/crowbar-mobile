# Technical Stack

> Last Updated: 2025-01-23
> Version: 1.0.0

## Core Technologies

### Application Framework
- **Framework:** React Native
- **Version:** 0.80.1
- **Language:** TypeScript 5.2+

### State Management
- **Primary:** Redux Toolkit
- **Version:** 2.0+
- **Persistence:** Redux Persist

## Frontend Stack

### JavaScript Framework
- **Framework:** React Native
- **Version:** 0.80.1
- **Build Tool:** Metro

### Navigation
- **Library:** React Navigation
- **Version:** 6.x
- **Architecture:** Bottom Tabs + Stack Navigation

### UI Framework
- **Framework:** React Native Paper (Material Design 3)
- **Version:** 5.x
- **Theme:** Custom theme with dark mode support

### Forms & Validation
- **Forms:** Formik
- **Validation:** Yup
- **Version:** Latest stable

### Animations
- **Library:** React Native Reanimated
- **Version:** 3.x
- **Use Cases:** Box opening animations, transitions

## Backend & Services

### Authentication & Database
- **Provider:** Firebase
- **Services:** Auth, Firestore, Analytics, Cloud Messaging
- **Version:** Latest SDK

### HTTP Client
- **Library:** Axios
- **Features:** Interceptors, retry logic, token management
- **Version:** 1.x

### Real-time Communication
- **Protocol:** WebSocket
- **Library:** socket.io-client
- **Use Cases:** Live updates, notifications

## Development Tools

### Code Quality
- **Linter:** ESLint with custom config
- **Formatter:** Prettier
- **Type Checking:** TypeScript strict mode

### Testing
- **Unit Tests:** Jest + React Native Testing Library
- **E2E Tests:** Detox
- **Coverage:** Target > 80%

## Mobile Platform Support

### Android
- **Min SDK:** 21 (Android 5.0)
- **Target SDK:** 34 (Android 14)
- **Build Tool:** Gradle

### iOS
- **Min Version:** iOS 13.0
- **Target:** Latest iOS
- **Build Tool:** Xcode + CocoaPods

## Infrastructure

### Application Hosting
- **Platform:** Firebase Hosting (Web admin)
- **Mobile Distribution:** Google Play Store + Apple App Store

### Analytics & Monitoring
- **Analytics:** Firebase Analytics + Custom Events
- **Crash Reporting:** Firebase Crashlytics
- **Performance:** Firebase Performance Monitoring

### Asset Management
- **Images:** Local assets + CDN for dynamic content
- **Icons:** React Native Vector Icons
- **Fonts:** Custom fonts via React Native

## Deployment

### CI/CD Pipeline
- **Platform:** GitHub Actions
- **Trigger:** Push to main/develop branches
- **Tests:** Run before deployment

### Environments
- **Development:** Local development
- **Staging:** Internal testing
- **Production:** App stores release

### Code Repository
- **URL:** https://github.com/crowbar/crowbar-mobile