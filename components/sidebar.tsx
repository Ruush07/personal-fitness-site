"use client"; // This tells Next.js this component needs to use the browser's brain

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Dumbbell, Utensils, Target } from "lucide-react";

export default function Sidebar() {
  // usePathname tells us exactly what page URL we are currently on
  const pathname = usePathname();

  // If we are on the login page, return nothing (hide the sidebar!)
  if (pathname === "/login") {
    return null;
  }

  // Otherwise, show the sidebar as normal
  return (
    <nav className="w-16 md:w-20 bg-neutral-900 border-r border-neutral-800 flex flex-col items-center py-8 gap-8 z-50">
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
        <Target size={24} />
      </Link>
    </nav>
  );
}