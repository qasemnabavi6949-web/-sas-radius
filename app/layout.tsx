import type {Metadata} from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'SAS RADIUS Accounting',
  description: 'RADIUS Accounting Server Dashboard',
};

export default function RootLayout({children}: {children: React.ReactNode}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="font-sans text-slate-100 antialiased bg-slate-900/40 min-h-screen" suppressHydrationWarning>
        {children}
      </body>
    </html>
  );
}
