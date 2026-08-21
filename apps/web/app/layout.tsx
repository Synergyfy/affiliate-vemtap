import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/hooks/use-auth";
import Providers from "@/components/providers";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Vemtap Affiliate Platform",
  description: "Multi-level affiliate marketing platform",
  manifest: "/manifest.json",
  icons: {
    icon: "/assets/favicon.ico",
    shortcut: "/assets/favicon.ico",
    apple: "/assets/favicon.ico",
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Vemtap Affiliate Platform",
  },
  formatDetection: {
    telephone: false,
  },
};

export const viewport: Viewport = {
  themeColor: "#000000",
};

import { ToastProvider } from "@/hooks/toast";
import PwaInstallProvider from "@/components/PwaInstallPrompt";
import NotificationSocketBridge from "@/components/NotificationSocketBridge";

const adminMockEnabled =
  process.env.NEXT_PUBLIC_ADMIN_MOCK?.trim().toLowerCase() === 'true' ||
  process.env.NEXT_PUBLIC_ADMIN_MOCK?.trim() === '1';

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {adminMockEnabled ? <meta name="admin-mock" content="true" /> : null}
      </head>
      <body className={inter.className} suppressHydrationWarning>
        <Providers>
          <AuthProvider>
            <ToastProvider>
              <PwaInstallProvider>
                <NotificationSocketBridge />
                {children}
              </PwaInstallProvider>
            </ToastProvider>
          </AuthProvider>
        </Providers>
      </body>
    </html>
  );
}
