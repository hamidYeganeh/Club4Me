import { NestedProfileLayout } from "@modules/profile/layouts/NestedProfileLayout";

export default function Layout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return <NestedProfileLayout>{children}</NestedProfileLayout>;
}
