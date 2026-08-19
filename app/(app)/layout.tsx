import { DashboardLayout } from "@/components/dashboard/DashboardLayout";

/**
 * Authenticated app shell for the "(app)" route group.
 * All segments under this group (dashboard today, workspace routes later)
 * share the product sidebar + top bar, which persist across navigation.
 */
export default function AppLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return <DashboardLayout>{children}</DashboardLayout>;
}
