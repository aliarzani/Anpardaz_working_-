# Stable build flow

The production web build is intentionally non-mutating. It runs Vite directly and does not rewrite `src/App.tsx`.

Requirements: Node.js 22+, Java 17+.

```bash
npm install
npm run build
npx cap sync android
cd android
./gradlew assembleDebug
```
