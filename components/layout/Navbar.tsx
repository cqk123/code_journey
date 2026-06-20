'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { cn } from '@/lib/utils';

interface NavbarProps {
  user?: { email: string } | null;
}

export function Navbar({ user }: NavbarProps) {
  const pathname = usePathname();

  const links = [
    { href: '/', label: '岗位Feed' },
    ...(user ? [
      { href: '/recommended', label: '推荐' },
      { href: '/saved', label: '收藏' },
    ] : []),
  ];

  return (
    <nav className="sticky top-0 z-40 glass border-b border-slate-200/50">
      <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">
        <div className="flex items-center gap-6">
          <Link href="/" className="group flex items-center gap-1.5">
            <span className="w-7 h-7 rounded-lg bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center text-white text-sm font-bold shadow-sm shadow-blue-500/20 group-hover:shadow-md group-hover:shadow-blue-500/30 transition-shadow">
              码
            </span>
            <span className="text-lg font-bold text-slate-800 tracking-tight">码途</span>
          </Link>
          <div className="hidden sm:flex gap-0.5">
            {links.map((l) => {
              const active = pathname === l.href;
              return (
                <Link
                  key={l.href}
                  href={l.href}
                  className={cn(
                    'relative px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-200',
                    active
                      ? 'text-blue-600 bg-blue-50/80'
                      : 'text-slate-500 hover:text-slate-800 hover:bg-slate-100/60'
                  )}
                >
                  {l.label}
                  {active && (
                    <span className="absolute bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-blue-500" />
                  )}
                </Link>
              );
            })}
          </div>
        </div>
        <div className="flex items-center gap-2">
          {user ? (
            <>
              <Link href="/profile" className="px-3 py-1.5 text-sm text-slate-500 hover:text-slate-800 hover:bg-slate-100/60 rounded-lg transition-all duration-200">
                我的
              </Link>
              <Link href="/settings" className="px-3 py-1.5 text-sm text-slate-500 hover:text-slate-800 hover:bg-slate-100/60 rounded-lg transition-all duration-200">
                设置
              </Link>
              <span className="text-sm text-slate-400 truncate max-w-[120px] pl-2 border-l border-slate-200 ml-1">
                {user.email}
              </span>
            </>
          ) : (
            <>
              <Link href="/auth/login">
                <Button variant="ghost" size="sm" className="text-slate-600">登录</Button>
              </Link>
              <Link href="/auth/register">
                <Button size="sm" className="shadow-sm shadow-blue-500/20 hover:shadow-md hover:shadow-blue-500/25 transition-shadow">注册</Button>
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}
