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
      {/* Notice the flex-col-reverse md:flex-row right below here! */}
      <body className={`${inter.className} bg-neutral-950 text-neutral-100 flex flex-col-reverse md:flex-row h-screen overflow-hidden`}>
        
        <Sidebar />

        <main className="flex-1 overflow-y-auto">
          {children}
        </main>

      </body>
    </html>
  );
}