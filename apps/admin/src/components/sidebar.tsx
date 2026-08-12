"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { BookOpen, LogOut } from "lucide-react";
import { logout } from "@/lib/api";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import type { SessionUser } from "@/lib/session";

export function Sidebar({ user }: { user: SessionUser }) {
  const pathname = usePathname();
  const router = useRouter();

  const handleLogout = async () => {
    await logout();
    router.replace("/login");
    router.refresh();
  };

  const active = pathname.startsWith("/dashboard") || pathname.startsWith("/stories");

  return (
    <aside className="flex w-60 shrink-0 flex-col bg-sidebar text-sidebar-foreground">
      <div className="flex items-center gap-2 border-b border-white/10 px-5 py-4">
        <BookOpen className="h-5 w-5" />
        <span className="text-lg font-bold">Little World</span>
      </div>
      <nav className="flex-1 p-3">
        <Link
          href="/dashboard"
          className={cn(
            "flex items-center gap-2.5 rounded-md px-3 py-2 text-sm font-medium text-white/70 transition-colors hover:bg-white/10 hover:text-white",
            active && "bg-white/10 text-white"
          )}
        >
          <BookOpen className="h-[18px] w-[18px]" /> Stories
        </Link>
      </nav>
      <div className="border-t border-white/10 p-4">
        <p className="mb-2 truncate text-xs text-white/60">
          {user.email}
          <span className="ml-1 rounded bg-white/10 px-1.5 py-0.5 uppercase">{user.role}</span>
        </p>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleLogout}
          className="w-full justify-start px-2 text-white/70 hover:bg-white/10 hover:text-white"
        >
          <LogOut className="h-4 w-4" /> Logout
        </Button>
      </div>
    </aside>
  );
}
