import { Analytics } from '@vercel/analytics/next';
import type { Metadata, Viewport } from 'next';
import { Fraunces, JetBrains_Mono, Outfit } from 'next/font/google';
import NextTopLoader from 'nextjs-toploader';
import { Toaster } from 'react-hot-toast';
import { SWRConfig } from 'swr';
import { TooltipProvider } from '@/components/ui/tooltip';
import './globals.css';

const sans = Outfit({
  subsets: ['latin'],
  variable: '--font-sans',
  display: 'swap',
});

const serif = Fraunces({
  subsets: ['latin'],
  axes: ['opsz'],
  variable: '--font-serif',
  display: 'swap',
});

const mono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-mono',
  display: 'swap',
});

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
  themeColor: '#1f2838', // matches dark --background (oklch(0.2759 0.0325 261.6825))
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body
        className={`${sans.variable} ${serif.variable} ${mono.variable} antialiased bg-background text-foreground`}
      >
        <NextTopLoader
          color="#0080B9" // matches dark --primary (oklch(0.5699 0.1271 238.3563))
          initialPosition={0.08}
          crawlSpeed={200}
          height={3}
          crawl={true}
          showSpinner={false}
          easing="ease"
          speed={200}
          shadow="0 0 10px #0080B9, 0 0 5px #0080B9"
        />
        <SWRConfig
          value={{
            dedupingInterval: 2000,
            errorRetryCount: 2,
            revalidateOnFocus: false,
          }}
        >
          <TooltipProvider>
            {children}
            {process.env.NODE_ENV === 'production' && <Analytics />}
          </TooltipProvider>
        </SWRConfig>
        <Toaster position="bottom-right" />
      </body>
    </html>
  );
}
