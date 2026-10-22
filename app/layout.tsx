import type { Metadata } from "next";
import "./globals.css";
import Sidebar from "@/components/sidebar";

export const metadata: Metadata = {
  title: "Personal Fitness Coach",
  description: "Track your training, build routines, and review your fitness progress.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      {/* h-[100dvh] is "Dynamic Viewport Height" - it adjusts when the browser bars appear/disappear */}
      <body className="font-sans bg-neutral-950 text-neutral-100 flex flex-col-reverse md:flex-row h-[100dvh] overflow-hidden">
        
        <Sidebar />

        <main className="flex-1 overflow-y-auto w-full relative">
          {children}
        </main>

      </body>
    </html>
  );
}
