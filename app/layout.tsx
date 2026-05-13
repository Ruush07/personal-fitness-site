import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Sidebar from "@/components/sidebar"; // We import our new smart sidebar!

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
      <body className={`${inter.className} bg-neutral-950 text-neutral-100 flex h-screen overflow-hidden`}>
        
        {/* Our new smart sidebar handles its own visibility */}
        <Sidebar />

        {/* THE MAIN CONTENT AREA */}
        <main className="flex-1 overflow-y-auto">
          {children}
        </main>

      </body>
    </html>
  );
}