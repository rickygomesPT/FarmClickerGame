import type { Metadata } from 'next';
import { Toaster } from "@/components/ui/toaster";
import { I18nProvider } from "@/lib/i18n";
import './globals.css';

export const metadata: Metadata = {
  title: 'Quinta Magnífica',
  description: 'An incremental game about farming, raising animals and fishing.',
};

interface RootLayoutProps {
  children: React.ReactNode;
}

export default function RootLayout({
  children
}: Readonly<RootLayoutProps>) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Alegreya:wght@400;700&display=swap" rel="stylesheet" />
      </head>
      <body className="font-body antialiased">
        <I18nProvider>
          {children}
        </I18nProvider>
        <Toaster />
      </body>
    </html>
  );
}
