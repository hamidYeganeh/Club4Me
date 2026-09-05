import { logoMarkVariants } from "./LogoMark.styles";
import {
  LOGO_COLOR,
  LOGO_SIZES,
  type LogoMarkProps,
  type LogoSize,
} from "./LogoMark.types";

/** Drop-shadow RGB channels for LOGO_COLOR (#1fff6f → 31, 255, 111). */
const LOGO_SHADOW_MATRIX =
  "0 0 0 0 0.121569 0 0 0 0 1 0 0 0 0 0.435294 0 0 0 0.25 0";

export function resolveLogoSize(size: LogoSize = "lg"): number {
  return typeof size === "number" ? size : LOGO_SIZES[size];
}

export function LogoMark({
  size = "lg",
  title = "Gym4Me",
  instanceId = "gym4me",
  color = LOGO_COLOR,
  shadow = true,
  gradient = true,
  className,
  ...props
}: LogoMarkProps) {
  const slots = logoMarkVariants();
  const px = resolveLogoSize(size);
  const clipId = `logo-clip-${instanceId}`;
  const filterId = `logo-filter-${instanceId}`;
  const paintId = `logo-paint-${instanceId}`;

  return (
    <svg
      width={px}
      height={px}
      viewBox="0 0 40 40"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={slots.root({ className })}
      role="img"
      aria-label={title}
      {...props}
    >
      {title ? <title>{title}</title> : null}
      <g clipPath={`url(#${clipId})`}>
        <g filter={shadow ? `url(#${filterId})` : undefined}>
          <path
            d="M23.4837 4.49353C21.2223 3.73975 18.7627 3.7447 16.5014 4.49848C15.5744 4.80747 14.8723 5.58398 14.664 6.53865L14.1078 9.08799C13.6584 11.1477 13.4337 12.1776 12.7287 12.8729C12.0237 13.5682 10.9908 13.7786 8.92504 14.1994L6.56159 14.6808C5.59537 14.8777 4.80734 15.5767 4.49552 16.5122C3.74175 18.7735 3.74074 21.2214 4.49452 23.4827C4.80706 24.4203 5.59804 25.1186 6.56719 25.3124L8.97514 25.794C11.0876 26.2165 12.1439 26.4277 12.8575 27.1414C13.5712 27.855 13.7824 28.9113 14.2049 31.0238L14.6865 33.4317C14.8803 34.4008 15.5786 35.1918 16.5162 35.5044C18.7775 36.2581 21.2223 36.2581 23.4837 35.5044C24.4213 35.1918 25.1196 34.4008 25.3134 33.4317L25.795 31.0238C26.2175 28.9113 26.4287 27.855 27.1424 27.1414C27.856 26.4277 28.9123 26.2165 31.0247 25.794L33.4327 25.3124C34.4018 25.1186 35.1928 24.4203 35.5054 23.4827C36.2591 21.2214 36.2591 18.7765 35.5054 16.5152C35.1928 15.5776 34.4018 14.8793 33.4327 14.6855L31.0247 14.2039C28.9123 13.7814 27.856 13.5702 27.1424 12.8565C26.4287 12.1429 26.2175 11.0866 25.795 8.97415L25.3134 6.5662C25.1196 5.59705 24.4213 4.80607 23.4837 4.49353Z"
            fill={color}
            shapeRendering="crispEdges"
          />
          {gradient ? (
            <path
              d="M16.4521 4.35059C18.7453 3.58622 21.2396 3.58117 23.5332 4.3457C24.5238 4.67599 25.2619 5.51126 25.4668 6.53516L25.9482 8.94336C26.1601 10.0028 26.3171 10.7852 26.5088 11.3926C26.6993 11.9963 26.9202 12.4134 27.2529 12.7461C27.5857 13.0788 28.0028 13.2997 28.6064 13.4902C29.2138 13.6819 29.9963 13.8389 31.0557 14.0508L33.4629 14.5322C34.487 14.737 35.323 15.475 35.6533 16.4658C36.4178 18.7592 36.4178 21.2388 35.6533 23.5322C35.323 24.5229 34.4869 25.261 33.4629 25.4658L31.0557 25.9473C29.9963 26.1591 29.2138 26.3162 28.6064 26.5078C28.0027 26.6983 27.5857 26.9192 27.2529 27.252C26.9202 27.5847 26.6993 28.0018 26.5088 28.6055C26.3171 29.2128 26.1601 29.9953 25.9482 31.0547L25.4668 33.4619C25.262 34.486 24.5239 35.322 23.5332 35.6523C21.2398 36.4168 18.7602 36.4168 16.4668 35.6523C15.476 35.3221 14.738 34.486 14.5332 33.4619L14.0518 31.0547C13.8399 29.9953 13.6828 29.2128 13.4912 28.6055C13.3007 28.0018 13.0798 27.5847 12.7471 27.252C12.4143 26.9192 11.9973 26.6983 11.3936 26.5078C10.7862 26.3162 10.0038 26.1592 8.94434 25.9473L6.53613 25.4658C5.51225 25.2609 4.67697 24.5228 4.34668 23.5322C3.5822 21.2388 3.5832 18.7562 4.34766 16.4629C4.67712 15.4745 5.50925 14.7353 6.53027 14.5273L8.89355 14.0459C9.9297 13.8348 10.6953 13.6792 11.29 13.4902C11.8811 13.3024 12.2904 13.0859 12.6191 12.7617C12.9478 12.4375 13.1702 12.0309 13.3662 11.4424C13.5634 10.8504 13.7297 10.0876 13.9551 9.05469L14.5117 6.50488C14.732 5.49621 15.4735 4.67682 16.4521 4.35059Z"
              stroke={`url(#${paintId})`}
              strokeWidth="0.3125"
              shapeRendering="crispEdges"
            />
          ) : null}
        </g>
      </g>
      <defs>
        {shadow ? (
          <filter
            id={filterId}
            x="-6.38281"
            y="-1.38184"
            width="52.7656"
            height="52.7642"
            filterUnits="userSpaceOnUse"
            colorInterpolationFilters="sRGB"
          >
            <feFlood floodOpacity="0" result="BackgroundImageFix" />
            <feColorMatrix
              in="SourceAlpha"
              type="matrix"
              values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0"
              result="hardAlpha"
            />
            <feOffset dy="5" />
            <feGaussianBlur stdDeviation="5" />
            <feComposite in2="hardAlpha" operator="out" />
            <feColorMatrix type="matrix" values={LOGO_SHADOW_MATRIX} />
            <feBlend
              mode="normal"
              in2="BackgroundImageFix"
              result="effect1_dropShadow"
            />
            <feBlend
              mode="normal"
              in="SourceGraphic"
              in2="effect1_dropShadow"
              result="shape"
            />
          </filter>
        ) : null}
        {gradient ? (
          <linearGradient
            id={paintId}
            x1="20.0002"
            y1="3.93066"
            x2="20.0002"
            y2="36.0697"
            gradientUnits="userSpaceOnUse"
          >
            <stop stopColor={color} />
            <stop offset="1" stopColor={color} stopOpacity="0" />
          </linearGradient>
        ) : null}
        <clipPath id={clipId}>
          <rect width="40" height="40" fill="white" />
        </clipPath>
      </defs>
    </svg>
  );
}

export { LOGO_COLOR, LOGO_SIZES };
