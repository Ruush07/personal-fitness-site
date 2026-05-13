"use client";

import { Dumbbell } from "lucide-react";

export default function WorkoutsPage() {
  return (
    <div className="p-6 md:p-12 max-w-5xl mx-auto min-h-screen text-neutral-100 flex flex-col items-center justify-center">
      <div className="p-4 bg-blue-500/10 rounded-3xl mb-6">
        <Dumbbell size={64} className="text-blue-500" />
      </div>
      <h1 className="text-3xl font-bold mb-4">Workout Builder</h1>
      <p className="text-neutral-400 text-center max-w-md">
        We are currently building the custom routine and volume tracker phase. Check back soon!
      </p>
    </div>
  );
}