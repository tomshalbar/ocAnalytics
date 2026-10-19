# Welcome to your Expo app 👋

This is an [Expo](https://expo.dev) project created with [`create-expo-app`](https://www.npmjs.com/package/create-expo-app).

## Get started

1. Install dependencies

   ```bash
   npm install
   ```

2. Start the app

   ```bash
   npx expo start
   ```

In the output, you'll find options to open the app in a

- [development build](https://docs.expo.dev/develop/development-builds/introduction/)
- [Android emulator](https://docs.expo.dev/workflow/android-studio-emulator/)
- [iOS simulator](https://docs.expo.dev/workflow/ios-simulator/)
- [Expo Go](https://expo.dev/go), a limited sandbox for trying out app development with Expo

You can start developing by editing the files inside the **app** directory. This project uses [file-based routing](https://docs.expo.dev/router/introduction).

## Get a fresh project

When you're ready, run:

```bash
npm run reset-project
```

This command will move the starter code to the **app-example** directory and create a blank **app** directory where you can start developing.

### Other setup steps

- To set up ESLint for linting, run `npx expo lint`, or follow our guide on ["Using ESLint and Prettier"](https://docs.expo.dev/guides/using-eslint/)
- If you'd like to set up unit testing, follow our guide on ["Unit Testing with Jest"](https://docs.expo.dev/develop/unit-testing/)
- Learn more about the TypeScript setup in this template in our guide on ["Using TypeScript"](https://docs.expo.dev/guides/typescript/)

## Learn more

To learn more about developing your project with Expo, look at the following resources:

- [Expo documentation](https://docs.expo.dev/): Learn fundamentals, or go into advanced topics with our [guides](https://docs.expo.dev/guides).
- [Learn Expo tutorial](https://docs.expo.dev/tutorial/introduction/): Follow a step-by-step tutorial where you'll create a project that runs on Android, iOS, and the web.

## Join the community

Join our community of developers creating universal apps.

- [Expo on GitHub](https://github.com/expo/expo): View our open source platform and contribute.
- [Discord community](https://chat.expo.dev): Chat with Expo users and ask questions.

## Connect to the backend (mobile)

Copy `.env.example` to `.env.local` and set `EXPO_PUBLIC_API_URL`.
Use your computer LAN IP on a phone, `http://10.0.2.2:8000` on an Android
emulator, or `http://127.0.0.1:8000` on an iOS simulator. Start the backend
with `uvicorn backend.main:app --host 0.0.0.0 --port 8000`, then restart Expo.
Never put database credentials in an `EXPO_PUBLIC_` variable.

## Backend connection layer

`src/data/api/locations.ts` provides `getLocations(locationId, signal)` for the
latest list or an individual source location. It validates responses and handles
configuration, network and HTTP errors. `useLocations(locationId?)` manages
loading, errors, refresh, cancellation and a 15-second timeout on native screens.

The original Home and area detail screens, cards and navigation are preserved.
They still use the explicitly labeled demo fixtures. The request layer is ready
for the frontend owner to connect once each existing area ID has a verified
RecSports LocationId. Do not guess mappings or interpret participant counts as
available courts. No UI components or screen design changes are required by the
request layer.

Example inside a screen or adapter owned by the frontend team:

```tsx
// Use a verified source LocationId, not the frontend slug.
const { rows, loading, error, notFound, refresh } =
  useLocations(sourceLocationId);
```

Import `useLocations` from `@/data/api/use-locations`. Without an argument the
hook requests all latest readings. A future adapter should map source readings
to the existing domain model only where their meanings match. The backend does
not currently provide free-court counts or verified crowd categories.

## Validation

```bash
npm run typecheck
npm run lint
```

The connection layer has been exercised against the real backend. Native device
verification and binding the original screens to verified area mappings remain
pending. Original screens intentionally remain demo previews until then.

Run the API client tests with Node.js 24 or newer (no live database required):

```bash
node --experimental-transform-types --test tests/locations.test.mjs
```

These cover configuration, URLs, response validation, empty lists, error status,
network failure, cancellation signal forwarding and freshness labels. They do
not replace native UI testing of the hook lifecycle and screen integration.
