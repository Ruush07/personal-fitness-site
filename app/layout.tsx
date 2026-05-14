import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Sidebar from "@/components/sidebar";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Fitness Tracker",
  description: "Personal health and workout logger",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      {/* h-[100dvh] is "Dynamic Viewport Height" - it adjusts when the browser bars appear/disappear */}
      <body className={`${inter.className} bg-neutral-950 text-neutral-100 flex flex-col-reverse md:flex-row h-[100dvh] overflow-hidden`}>
        
        <Sidebar />

        <main className="flex-1 overflow-y-auto w-full relative">
          {children}
        </main>

      </body>
    </html>
  );
}