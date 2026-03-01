import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'FoodPod – Fresh Agri Produce Delivered',
  description:
    'Order premium quality palm oil, yam, rice, beans, and more straight from trusted local farmers. Fast, reliable delivery across Nigeria.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap"
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
