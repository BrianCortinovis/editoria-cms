import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { Toaster } from "react-hot-toast";
import ThemeInit from "@/components/layout/ThemeInit";
import "./globals.css";

const inter = Inter({
  variable: "--font-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Editoria CMS",
  description: "Sistema editoriale multi-testata",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="it" data-theme="dark" suppressHydrationWarning>
      <body className={`${inter.variable} antialiased`}>
        <ThemeInit />
        {children}
        <Toaster
          position="bottom-right"
          toastOptions={{
            style: {
              background: "var(--c-bg-2)",
              color: "var(--c-text-0)",
              border: "1px solid var(--c-border)",
              fontSize: "0.875rem",
            },
          }}
        />
      </body>
    </html>
  );
}
