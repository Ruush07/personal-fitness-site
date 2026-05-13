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
      {/* flex-col-reverse puts sidebar at bottom on mobile. md:flex-row puts it on the left for laptop */}
      <body className={`${inter.className} bg-neutral-950 text-neutral-100 flex flex-col-reverse md:flex-row h-screen overflow-hidden`}>
        
        <Sidebar />

        <main className="flex-1 overflow-y-auto w-full h-full">
          {children}
        </main>

      </body>
    </html>
  );
}