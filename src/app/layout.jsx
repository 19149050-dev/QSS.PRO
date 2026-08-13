import './globals.css';
import { Inter } from 'next/font/google';

const inter = Inter({ subsets: ['latin', 'vietnamese'] });

export const metadata = {
  title: 'QSS PRO - Quản Lý Tiến Độ Lấy Tiền & Thanh Toán Tổ Đội',
  description: 'Hệ thống phần mềm chuyên nghiệp cho Kỹ sư Khối lượng (QS) & Ban Quản Lý Dự Án.',
};

export default function RootLayout({ children }) {
  return (
    <html lang="vi" className={inter.className}>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap" rel="stylesheet" />
        <link rel="stylesheet" href="/output.css" />
      </head>
      <body className="bg-slate-100 text-slate-900 antialiased min-h-screen">
        {children}
      </body>
    </html>
  );
}
