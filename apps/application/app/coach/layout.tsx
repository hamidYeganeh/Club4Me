export default function CoachLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="flex min-h-dvh flex-1 flex-col pb-[calc(5.75rem+env(safe-area-inset-bottom))]">
      {children}
    </div>
  );
}
