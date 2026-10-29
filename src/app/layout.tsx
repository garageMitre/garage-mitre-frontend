import './globals.css';
import { cn } from '@/lib/utils';
import { ThemeProvider } from '@/components/theme-provider';
import { Toaster as SonnerToaster } from '@/components/ui/sonner';
import { Toaster } from '@/components/ui/toaster';
import { cookies } from 'next/headers';
import { Metadata } from 'next';
import { Oswald, JetBrains_Mono } from 'next/font/google';

// Solo como variables: las usan las utilidades gm-display y gm-mono (admin de tarifas); la
// fuente general de la app no cambia.
const oswald = Oswald({
  subsets: ['latin'],
  display: 'swap',
  weight: ['400', '500', '600', '700'],
  variable: '--font-display',
});

const mono = JetBrains_Mono({
  subsets: ['latin'],
  display: 'swap',
  weight: ['400', '500', '600'],
  variable: '--font-mono',
});


export const metadata: Metadata = {
  title: 'Garage Mitre',
  description: 'Garage Mitre',
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {

  return (
    <html lang="es" suppressHydrationWarning>
      <body
        className={cn(
          'min-h-[100dvh] bg-background text-foreground antialiased mx-auto font-sans',
          oswald.variable,
          mono.variable,
        )}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem={false}
          forcedTheme="dark"
          disableTransitionOnChange
        >
          {children}
        </ThemeProvider>
        <SonnerToaster />
        <Toaster />
      </body>
    </html>
  );
}
