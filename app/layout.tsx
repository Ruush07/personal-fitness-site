import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Link from "next/link";
import { LayoutDashboard, Dumbbell, Utensils } from "lucide-react";

// This sets the default font for your entire app
const inter = Inter({ subsets: ["latin"] });

// This is the metadata that shows up in the browser tab
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
        
        {/* THE SIDEBAR: 
          We use Tailwind to make it 64px wide, dark gray, with a border on the right.
          It flexes vertically (flex-col) to stack the icons.
        */}
        <nav className="w-16 md:w-20 bg-neutral-900 border-r border-neutral-800 flex flex-col items-center py-8 gap-8 z-50">
          
          {/* Link is a Next.js component that changes pages instantly without reloading the browser */}
          <Link href="/" className="p-3 text-neutral-400 hover:text-blue-500 hover:bg-neutral-800 rounded-xl transition-all">
            <LayoutDashboard size={24} />
          </Link>
          
          <Link href="/workouts" className="p-3 text-neutral-400 hover:text-blue-500 hover:bg-neutral-800 rounded-xl transition-all">
            <Dumbbell size={24} />
          </Link>

          <Link href="/nutrition" className="p-3 text-neutral-400 hover:text-blue-500 hover:bg-neutral-800 rounded-xl transition-all">
            <Utensils size={24} />
          </Link>
          <Link href="/goals" className="p-3 text-neutral-400 hover:text-blue-500 hover:bg-neutral-800 rounded-xl transition-all">
            <Target size="{24}"/>
          </Link>
        </nav>

        {/* THE MAIN CONTENT AREA:
          'children' represents whatever page you are currently on (like your Dashboard).
          flex-1 makes it take up all the remaining space next to the sidebar.
          overflow-y-auto allows you to scroll the page content while the sidebar stays fixed.
        */}
        <main className="flex-1 overflow-y-auto">
          {children}
        </main>

      </body>
    </html>
  );
}