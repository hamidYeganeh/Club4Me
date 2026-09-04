# Turborepo starter

> راه‌اندازی سریع دموی اندروید، حساب‌های نمونه، پرداخت ماک و تنظیمات انتشار در
> [راهنمای دموی اندروید](docs/demo-android-fa.md) آمده است.

This Turborepo starter is maintained by the Turborepo core team.

## Using this example

Run the following command:

```sh
npx create-turbo@latest
```

## What's inside?

This Turborepo includes the following packages/apps:

### Apps and Packages

- `website` — marketing site (`http://localhost:7080`)
- `application` — member app (`http://localhost:7081`)
- `admin` — admin panel (`http://localhost:7082`)
- `business` — business dashboard (`http://localhost:7083`)
- `backend` — API server (`http://localhost:7088`)
- `@repo/api` — versioned HTTP client and TanStack Query domain hooks
- `@repo/i18n` — shared next-intl setup (fa / Asia/Tehran)
- `@repo/theme` — HeroUI theme CSS variables
- `@repo/ui` — shared React components
- `@repo/eslint-config` — shared ESLint configs
- `@repo/typescript-config` — shared TypeScript configs

Each package/app is 100% [TypeScript](https://www.typescriptlang.org/).

### Utilities

This Turborepo has some additional tools already setup for you:

- [TypeScript](https://www.typescriptlang.org/) for static type checking
- [ESLint](https://eslint.org/) for code linting
- [Prettier](https://prettier.io) for code formatting

### Build

To build all apps and packages, run the following command:

With [global `turbo`](https://turborepo.dev/docs/getting-started/installation#global-installation) installed (recommended):

```sh
cd my-turborepo
turbo build
```

Without global `turbo`, use your package manager:

```sh
cd my-turborepo
npx turbo build
npm exec turbo build
```

You can build a specific package by using a [filter](https://turborepo.dev/docs/crafting-your-repository/running-tasks#using-filters):

```sh
turbo build --filter=website
```

### Develop

To develop all apps and packages, run:

```sh
turbo dev
```

Or a single app:

```sh
turbo dev --filter=application
```

### Backend env

Copy `apps/backend/.env.example` to `apps/backend/.env` and set:

- `MONGODB_URL`
- `REDIS_URL`
- `JWT_SECRET`
- `JWT_EXPIRES_IN`
- `PORT` (default `7088`)
