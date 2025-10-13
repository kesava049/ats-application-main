export default function AnalyticsLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // Simply return children without any wrapper - the ClientLayout will handle the UI
  return <>{children}</>
}
