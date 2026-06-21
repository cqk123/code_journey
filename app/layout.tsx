import type { Metadata } from 'next';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { ToastProvider } from '@/components/ui/Toast';
import { getUser } from '@/lib/auth';
import './globals.css';

export const metadata: Metadata = {
  title: '码途 - 计算机工作机会信息平台',
  description: '跨平台岗位聚合，简历智能匹配，五维组合筛选',
  icons: { icon: '/favicon.ico' },
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getUser().catch(() => null);

  return (
    <html lang="zh-CN">
      <body className="min-h-screen flex flex-col">
        <ToastProvider>
          <Navbar user={user} />
          <main className="flex-1">{children}</main>
          <Footer />
        </ToastProvider>
      </body>
    </html>
  );
}
