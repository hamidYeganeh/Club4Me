import path from "node:path";
import { fileURLToPath } from "node:url";

import sharp from "sharp";

const BRAND_BACKGROUND = "#1eff6d";
const BRAND_MARK = "#353535";
const LOGO_PATH =
  "M27.2574 4.44481C23.3448 4.8477 20.11 6.63991 17.8743 9.64325C17.3926 10.2903 17.0068 10.9506 11.1206 21.2026C9.31709 24.3438 6.99163 28.3939 5.95287 30.2028C3.72894 34.0755 3.64981 34.2277 3.22585 35.4502C2.65995 37.0817 2.50652 38.0202 2.50024 39.8896C2.49404 41.7079 2.60768 42.4968 3.09883 44.044C4.29075 47.7992 7.24959 50.8293 11.0325 52.1688C15.5813 53.7797 20.7882 52.6451 24.2579 49.2871C24.5613 48.9935 25.5479 47.9309 26.4502 46.9257C31.983 40.7625 44.0942 27.3661 44.1547 27.3423C44.1944 27.3267 43.2629 28.992 42.0848 31.0431C40.9065 33.0942 39.1518 36.1499 38.1853 37.8335C37.2189 39.5172 35.7428 42.0872 34.9051 43.5447C34.0674 45.0022 32.593 47.5722 31.6285 49.2559C30.6642 50.9395 29.4948 52.975 29.0302 53.7791C28.5654 54.5832 27.9696 55.6524 27.706 56.155C26.073 59.2683 25.7218 62.8537 26.7124 66.298C28.0897 71.0866 32.4609 74.7034 37.5968 75.304C41.4955 75.7599 45.6285 74.2593 48.3409 71.4031C49.4842 70.1992 49.6024 70.0176 52.2562 65.3842C53.3213 63.5246 55.0316 60.5434 56.057 58.7593C57.0824 56.9751 58.0027 55.3714 58.1021 55.1955C58.4113 54.6481 61.4299 49.3877 62.4542 47.6111C62.9902 46.6813 64.8333 43.4739 66.5499 40.4835C77.5471 21.3258 76.5853 23.0609 77.0981 21.4543C77.576 19.9571 77.6941 19.1356 77.6923 17.3191C77.6909 15.9624 77.6547 15.5061 77.4856 14.7148C76.9215 12.0746 75.8399 10.0485 74.0196 8.22158C72.1856 6.38122 70.0261 5.20929 67.4299 4.64566C66.2039 4.37948 63.7339 4.357 62.5167 4.60098C60.9078 4.92354 59.1663 5.61391 57.9287 6.41969C56.3724 7.43298 56.33 7.47684 48.7843 15.8564C48.5131 16.1576 48.1786 16.5277 48.0411 16.6789C47.9035 16.8299 45.1582 19.8803 41.9404 23.4576C38.7226 27.0348 36.0625 29.9646 36.0291 29.9683C35.9955 29.972 36.1747 29.6152 36.4272 29.1754C40.0717 22.8264 40.2419 22.4882 40.6935 20.6934C42.2011 14.7028 39.5753 8.69556 34.231 5.90897C33.0972 5.31784 31.9029 4.89823 30.673 4.65891C29.7959 4.48831 27.9555 4.37299 27.2574 4.44481Z";

const appDirectory = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
);

function logoSvg(canvasSize, logoSize, background = BRAND_BACKGROUND) {
  const offset = (canvasSize - logoSize) / 2;
  const scale = logoSize / 80;
  const backgroundMarkup = background
    ? `<rect width="${canvasSize}" height="${canvasSize}" fill="${background}"/>`
    : "";

  return Buffer.from(`
    <svg width="${canvasSize}" height="${canvasSize}" viewBox="0 0 ${canvasSize} ${canvasSize}" xmlns="http://www.w3.org/2000/svg">
      ${backgroundMarkup}
      <path d="${LOGO_PATH}" fill="${BRAND_MARK}" fill-rule="evenodd" clip-rule="evenodd" transform="translate(${offset} ${offset}) scale(${scale})"/>
    </svg>
  `);
}

async function renderSquare(
  target,
  size,
  logoRatio,
  background = BRAND_BACKGROUND,
) {
  let image = sharp(logoSvg(size, size * logoRatio, background));

  if (background) {
    image = image.flatten({ background }).removeAlpha();
  }

  await image
    .png({ compressionLevel: 9 })
    .toFile(path.join(appDirectory, target));
}

const iconTargets = [
  ["app/icon.png", 512],
  ["app/apple-icon.png", 180],
  ["public/icons/icon-192.png", 192],
  ["public/icons/icon-512.png", 512],
  ["ios/App/App/Assets.xcassets/AppIcon.appiconset/AppIcon-512@2x.png", 1024],
];

const androidDensities = [
  ["mdpi", 48, 108],
  ["hdpi", 72, 162],
  ["xhdpi", 96, 216],
  ["xxhdpi", 144, 324],
  ["xxxhdpi", 192, 432],
];

const splashSizes = [
  ["mdpi", 320],
  ["hdpi", 480],
  ["xhdpi", 640],
  ["xxhdpi", 960],
  ["xxxhdpi", 1280],
];

await Promise.all([
  ...iconTargets.map(([target, size]) => renderSquare(target, size, 0.56)),
  ...androidDensities.flatMap(([density, legacySize, foregroundSize]) => [
    renderSquare(
      `android/app/src/main/res/mipmap-${density}/ic_launcher.png`,
      legacySize,
      0.56,
    ),
    renderSquare(
      `android/app/src/main/res/mipmap-${density}/ic_launcher_round.png`,
      legacySize,
      0.56,
    ),
    renderSquare(
      `android/app/src/main/res/mipmap-${density}/ic_launcher_foreground.png`,
      foregroundSize,
      0.44,
      null,
    ),
  ]),
  renderSquare("android/app/src/main/res/drawable/splash.png", 1280, 0.14),
  ...splashSizes.flatMap(([density, size]) =>
    ["port", "land"].map((orientation) =>
      renderSquare(
        `android/app/src/main/res/drawable-${orientation}-${density}/splash.png`,
        size,
        0.14,
      ),
    ),
  ),
  ...["splash-2732x2732.png", "splash-2732x2732-1.png", "splash-2732x2732-2.png"].map(
    (name) =>
      renderSquare(
        `ios/App/App/Assets.xcassets/Splash.imageset/${name}`,
        2732,
        0.14,
      ),
  ),
]);
