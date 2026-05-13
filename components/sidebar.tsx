"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { LayoutDashboard, Dumbbell, Utensils, Target, LogOut } from "lucide-react";

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();

  if (pathname === "/login") {
    return null;
  }

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push("/login");
  };

  return (
    <nav className="w-16 md:w-20 bg-neutral-900 border-r border-neutral-800 flex flex-col justify-between items-center py-8 z-50">
      
      {/* Top Nav Icons */}
      <div className="flex flex-col gap-8">
        <Link href="/" className={`p-3 rounded-xl transition-all ${pathname === '/' ? 'text-blue-500 bg-neutral-800 shadow-sm' : 'text-neutral-400 hover:text-blue-500 hover:bg-neutral-800'}`}>
          <LayoutDashboard size={24} />
        </Link>
        <Link href="/workouts" className={`p-3 rounded-xl transition-all ${pathname === '/workouts' ? 'text-blue-500 bg-neutral-800 shadow-sm' : 'text-neutral-400 hover:text-blue-500 hover:bg-neutral-800'}`}>
          <Dumbbell size={24} />
        </Link>
        <Link href="/nutrition" className={`p-3 rounded-xl transition-all ${pathname === '/nutrition' ? 'text-blue-500 bg-neutral-800 shadow-sm' : 'text-neutral-400 hover:text-blue-500 hover:bg-neutral-800'}`}>
          <Utensils size={24} />
        </Link>
        <Link href="/goals" className={`p-3 rounded-xl transition-all ${pathname === '/goals' ? 'text-blue-500 bg-neutral-800 shadow-sm' : 'text-neutral-400 hover:text-blue-500 hover:bg-neutral-800'}`}>
          <Target size={24} />
        </Link>
      </div>

      {/* Bottom Sign Out Button */}
      <button 
        onClick={handleSignOut} 
        className="p-3 text-neutral-500 hover:text-red-500 hover:bg-red-500/10 rounded-xl transition-all mt-auto"
        title="Sign Out"
      >
        <LogOut size={24} />
      </button>

    </nav>
  );
}