import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { Sidebar } from '@/components/Sidebar';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Indesport Contabilidad',
  description: 'Gestión contable profesional para gimnasios.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" className="dark" suppressHydrationWarning>
      <body className={`${inter.className} min-h-screen bg-[#0a0a0a] text-foreground antialiased flex`}>
        <Sidebar />
        <main className="flex-1 lg:pl-64 transition-all duration-300">
          <div className="container mx-auto px-4 md:px-8 py-8 lg:py-10 max-w-7xl">
            {children}
          </div>
        </main>
      </body>
    </html>
  );
}
