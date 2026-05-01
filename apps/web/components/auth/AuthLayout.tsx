import { ReactNode } from "react";

interface AuthLayoutProps {
  children: ReactNode;
  title?: string;
  subtitle?: string;
  footerText?: string;
  footerLinkText?: string;
  footerLinkHref?: string;
}

export default function AuthLayout({
  children,
  title,
  subtitle,
  footerText,
  footerLinkText,
  footerLinkHref,
}: AuthLayoutProps) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="w-full max-w-md p-6 bg-white rounded-lg shadow-md">
        {title && (
          <div className="text-center mb-6">
            <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
            {subtitle && (
              <p className="mt-2 text-sm text-gray-600">{subtitle}</p>
            )}
          </div>
        )}
        {children}
        {footerText && footerLinkText && (
          <p className="mt-4 text-center text-sm text-gray-600">
            {footerText}{" "}
            <a href={footerLinkHref} className="text-blue-600 hover:underline">
              {footerLinkText}
            </a>
          </p>
        )}
      </div>
    </div>
  );
}
