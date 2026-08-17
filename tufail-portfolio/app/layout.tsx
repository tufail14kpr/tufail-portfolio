import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Md Tufail | Full-Stack Developer',
  description: 'Full-Stack Web Developer specializing in React, Next.js, Node.js, and MongoDB. Building modern, scalable web applications.',
  keywords: ['Full Stack Developer', 'React', 'Next.js', 'Node.js', 'MongoDB', 'Web Developer', 'Md Tufail'],
  authors: [{ name: 'Md Tufail', url: 'https://github.com/tufail14kpr' }],
  openGraph: {
    title: 'Md Tufail | Full-Stack Developer',
    description: 'Full-Stack Web Developer specializing in React, Next.js, Node.js, and MongoDB.',
    type: 'website',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@300;400;500;600;700&family=Inter:wght@300;400;500;600;700&family=Space+Mono:wght@400;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        <div className="bg-gradient-animated">
          <div className="bg-orb bg-orb-1" />
          <div className="bg-orb bg-orb-2" />
          <div className="bg-orb bg-orb-3" />
        </div>
        <div className="noise-overlay" />
        {children}
      </body>
    </html>
  );
}
