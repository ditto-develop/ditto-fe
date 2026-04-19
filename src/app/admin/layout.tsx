'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect } from 'react';

const NAV_ITEMS = [
  { href: '/admin/db', label: 'DB 관리' },
  { href: '/admin/users', label: '사용자' },
  { href: '/admin/quiz-progress', label: '퀴즈 참여 현황' },
  { href: '/admin/matches', label: '매칭 관리' },
  { href: '/admin/quizzes', label: '이번주 퀴즈' },
  { href: '/admin/time-override', label: '시간 조정' },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();

  const isLoginPage = pathname === '/admin/login';

  useEffect(() => {
    if (isLoginPage) return;
    const token = localStorage.getItem('adminAccessToken');
    if (!token) {
      router.push('/admin/login');
    }
  }, [router, isLoginPage]);

  if (isLoginPage) {
    return <>{children}</>;
  }

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--color-semantic-background-elevated-alternative)', fontFamily: 'sans-serif' }}>
      {/* Sidebar */}
      <aside
        style={{
          width: 200,
          background: 'var(--color-semantic-inverse-background)',
          color: 'var(--color-semantic-static-white)',
          display: 'flex',
          flexDirection: 'column',
          padding: '24px 0',
          flexShrink: 0,
        }}
      >
        <div style={{ padding: '0 20px 24px', fontSize: 18, fontWeight: 700, borderBottom: '1px solid var(--color-semantic-line-normal-strong)' }}>
          ⚙️ 관리자
        </div>
        <nav style={{ marginTop: 16 }}>
          {NAV_ITEMS.map((item) => {
            const active = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                style={{
                  display: 'block',
                  padding: '12px 20px',
                  color: active ? 'var(--color-semantic-accent-foreground-violet)' : 'var(--color-semantic-inverse-label)',
                  textDecoration: 'none',
                  fontWeight: active ? 600 : 400,
                  background: active ? 'rgba(124,107,255,0.1)' : 'transparent',
                  borderLeft: active ? '3px solid var(--color-semantic-accent-foreground-violet)' : '3px solid transparent',
                  transition: 'all 0.15s',
                }}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>
      </aside>

      {/* Main content */}
      <main style={{ flex: 1, padding: 32, overflowY: 'auto' }}>
        {children}
      </main>
    </div>
  );
}
