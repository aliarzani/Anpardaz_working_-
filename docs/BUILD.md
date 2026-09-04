# Stable build flow

The production web build is intentionally non-mutating. It runs Vite directly and does not rewrite `src/App.tsx`.

Requirements: Node.js 22+, Java 21+ (required by Capacitor 8).

```bash
npm install
npm run build
npx cap sync android
cd android
./gradlew assembleDebug
```
