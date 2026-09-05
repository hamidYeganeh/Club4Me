# Gym4Me Android application

Next.js static export packaged with Capacitor 8.

## Production configuration

Copy `.env.example` to `.env.production` and set the public HTTPS backend URL,
website URL, Neshan key, and optional Sentry DSN. Never commit `.env.production`,
`google-services.json`, signing keystores, or Firebase service-account keys.

Push notifications require `android/app/google-services.json` from the matching
Firebase Android app (`com.gym4me.app`). The backend separately needs
the three `FIREBASE_*` service-account variables documented in
`apps/backend/.env.example`.

Build a signed release with explicit monotonic versions:

```bash
npm run cap:sync -w apps/application
cd apps/application/android
./gradlew bundleRelease \
  -PGYM4ME_VERSION_CODE=2 \
  -PGYM4ME_VERSION_NAME=1.0.1
```

The unsigned/locally signed bundle is generated under
`android/app/build/outputs/bundle/release`. Configure the upload key through CI
secrets: `GYM4ME_ANDROID_KEYSTORE`, `GYM4ME_ANDROID_KEYSTORE_PASSWORD`,
`GYM4ME_ANDROID_KEY_ALIAS`, and `GYM4ME_ANDROID_KEY_PASSWORD`.

## Release gates

The admin panel route `/app-releases` controls optional updates, minimum
supported version, maintenance mode, release notes, store URL, and feature
flags. Only enable a required update after the new version is actually visible
in the target store.

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
