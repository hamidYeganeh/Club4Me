export function NestedProfileLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="-mb-[calc(6.25rem+env(safe-area-inset-bottom))] flex min-h-0 flex-1 flex-col">
      {children}
    </div>
  );
}
