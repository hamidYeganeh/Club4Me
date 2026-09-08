import NextLink from "next/link";
import { forwardRef, type ComponentPropsWithoutRef } from "react";

type AppLinkProps = ComponentPropsWithoutRef<typeof NextLink>;

/** Route data loads on the destination page; links never prefetch it. */
const AppLink = forwardRef<HTMLAnchorElement, AppLinkProps>(
  function AppLink(props, ref) {
    return <NextLink {...props} ref={ref} prefetch={false} />;
  },
);

export default AppLink;
