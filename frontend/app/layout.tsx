import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { ToastProvider } from "@/src/providers/ToastProvider";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "FlowSpace - Real-time Collaboration Platform",
  description: "A modern real-time collaboration platform for teams",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <ToastProvider>{children}</ToastProvider>
      </body>
    </html>
  );
}
