import type {Metadata} from 'next';
import { Poppins } from 'next/font/google';
import './globals.css';
import { AuthProvider } from '@/hooks/use-auth';
import { ToastProvider } from '@/hooks/use-toast';

const poppins = Poppins({
  subsets: ['latin'],
  weight: ['100', '200', '300', '400', '500', '600', '700', '800', '900'],
  variable: '--font-poppins',
});

export const metadata: Metadata = {
  title: 'Vemtap Affiliate Platform | Earn by Referring',
  description: 'Join the Vemtap network and earn up to 20% commission when businesses subscribe to our NFC and QR technology.',
};

export default function RootLayout({children}: {children: React.ReactNode}) {
  return (
    <html lang="en" className={`${poppins.variable}`}>
      <body suppressHydrationWarning className="font-poppins antialiased bg-white text-slate-900">
        <AuthProvider>
          <ToastProvider>
            {children}
          </ToastProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
