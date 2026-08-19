import { Analytics } from '@vercel/analytics/next';
import type { Metadata, Viewport } from 'next';
import NextTopLoader from 'nextjs-toploader';
import { TooltipProvider } from '@/components/ui/tooltip';
import './globals.css';

export const metadata: Metadata = {
  title: 'Vibeflow — Agentic Development & Content Creation Platform',
  description: 'AI-powered coding agents, design canvases, video studio, and visual workflows — all in one remote workspace.',
  keywords: ['AI', 'agents', 'MCP', 'design', 'video', 'workspace', 'coding', 'development'],
  generator: 'Vibeflow',
  icons: {
    icon: '/icon.svg',
    apple: '/apple-icon.png',
  },
  openGraph: {
    title: 'Vibeflow',
    description: 'Agentic Development & Content Creation Platform',
    type: 'website',
  },
};

export const viewport: Viewport = {
  colorScheme: 'dark',
  themeColor: '#0a0a0f',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className="antialiased bg-background text-foreground">
        <NextTopLoader
          color="#6366f1"
          initialPosition={0.08}
          crawlSpeed={200}
          height={3}
          crawl={true}
          showSpinner={false}
          easing="ease"
          speed={200}
          shadow="0 0 10px #6366f1, 0 0 5px #6366f1"
        />
        <TooltipProvider>
          {children}
          {process.env.NODE_ENV === 'production' && <Analytics />}
        </TooltipProvider>
      </body>
    </html>
  );
}
