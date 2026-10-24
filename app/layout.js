import { Archivo, Public_Sans } from 'next/font/google';
import Nav from '@/components/Nav';
import './globals.css';

const archivo = Archivo({ subsets: ['latin'], axes: ['wdth'], variable: '--font-archivo' });
const publicSans = Public_Sans({ subsets: ['latin'], variable: '--font-public-sans' });

export const metadata = {
  title: 'Campus Lost & Found',
  description: 'Report lost and found items on campus. Matching reports are found automatically.',
};

// applies a saved light/dark choice before first paint
const themeScript = `try{var t=localStorage.getItem('theme');if(t)document.documentElement.dataset.theme=t}catch(e){}`;

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={`${archivo.variable} ${publicSans.variable}`} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body className="min-h-screen">
        <Nav />
        <main className="mx-auto max-w-6xl px-4 pb-20 pt-8 sm:px-6">{children}</main>
      </body>
    </html>
  );
}
