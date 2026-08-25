# ClassZ Mobile Build Checklist

## Build Scope (Figma file `GmdFYzfDwKyURdqdeUnGx2`)

- [x] Expo React Native TypeScript project initialized in `ClassZ-Mobile`
- [x] Dependency baseline installed for navigation, storage, and auth
- [x] Two-step portal login flow implemented (Centre/Teacher + Parent/Student)
- [x] API login wired to `classz-api` via `EXPO_PUBLIC_API_BASE_URL`
- [x] Session persistence via `AsyncStorage`
- [x] Bottom tab navigation added (`Home`, `Search`, `Schedule`, `Dashboard`, `Profile`)
- [x] Figma flow inventory integrated as in-app searchable library
- [x] Flow detail view connected for each listed Figma node

## Screen Coverage

- [x] Core family app flow scaffolded (`Main`, `Search`, `Schedule`, `Reservation`, `Profile`, `Inbox`, `Notification`)
- [x] Coach/owner/centre flow entries mapped into a shared navigable library
- [x] Learning Companion / Learning Record flow entries mapped (`Academic`, `Activity`, animal persona pages)

## Validation

- [x] TypeScript compile check: `./node_modules/.bin/tsc --noEmit`
- [x] Expo health check: `npx expo-doctor` (20/20 passed)
- [x] Web bundle smoke build: `npx expo export --platform web`

## Notes For Next Pass

- Pixel-perfect parity for every single Figma screen should be completed incrementally by replacing scaffold screens with node-level UI builds from `get_design_context`.
- To test against local backend from simulator/device, set:
  - `EXPO_PUBLIC_API_BASE_URL=http://<your-lan-ip>:3003`
  - avoid `localhost` when testing on physical devices.
