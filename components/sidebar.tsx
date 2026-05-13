"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { LayoutDashboard, Dumbbell, Utensils, Target, LogOut } from "lucide-react";

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();

  if (pathname === "/login") return null;

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push("/login");
  };

  return (
    <nav className="w-full md:w-20 h-16 md:h-screen bg-neutral-900 border-t md:border-t-0 md:border-r border-neutral-800 flex flex-row md:flex-col justify-around md:justify-between items-center px-2 md:py-8 z-[100] shrink-0 pb-safe">
      <div className="flex flex-row md:flex-col justify-around md:justify-start w-full md:w-auto gap-1 md:gap-8">
        <Link href="/" className={`p-3 rounded-xl transition-all ${pathname === '/' ? 'text-blue-500 bg-neutral-800' : 'text-neutral-400'}`}>
          <LayoutDashboard size={24} />
        </Link>
        <Link href="/workouts" className={`p-3 rounded-xl transition-all ${pathname === '/workouts' ? 'text-blue-500 bg-neutral-800' : 'text-neutral-400'}`}>
          <Dumbbell size={24} />
        </Link>
        <Link href="/nutrition" className={`p-3 rounded-xl transition-all ${pathname === '/nutrition' ? 'text-blue-500 bg-neutral-800' : 'text-neutral-400'}`}>
          <Utensils size={24} />
        </Link>
        <Link href="/goals" className={`p-3 rounded-xl transition-all ${pathname === '/goals' ? 'text-blue-500 bg-neutral-800' : 'text-neutral-400'}`}>
          <Target size={24} />
        </Link>
        <button onClick={handleSignOut} className="md:hidden p-3 text-neutral-500"><LogOut size={24} /></button>
      </div>
      <button onClick={handleSignOut} className="hidden md:flex p-3 text-neutral-500 hover:text-red-500 mt-auto"><LogOut size={24} /></button>
    </nav>
  );
}