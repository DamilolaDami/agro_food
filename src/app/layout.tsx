import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Foodpod – Premium Foodstuffs at True Wholesale Prices',
  description:
    'Get premium foodstuffs at true wholesale prices. Smarter shopping, bigger savings, zero stress. Free doorstep delivery. Pay only on delivery.',
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
