import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Script from "next/script";
import { ThemeProvider } from "@/components/theme/theme-provider";
import { AuthProvider } from "@/contexts/auth-context";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "JobDex.in",
  description:
    "Aplikasi manajemen job desk untuk Humas dan Media Kreatif organisasi mahasiswa.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="id"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <body className="min-h-full">
        <Script id="jobdex-theme-init" strategy="beforeInteractive">
          {`
            (function() {
              try {
                var storedTheme = localStorage.getItem('jobdex-theme');
                var prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
                var theme = storedTheme === 'dark' || storedTheme === 'light' ? storedTheme : (prefersDark ? 'dark' : 'light');
                document.documentElement.classList.toggle('dark', theme === 'dark');
              } catch (error) {}
            })();
          `}
        </Script>
        <ThemeProvider>
          <AuthProvider>{children}</AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
