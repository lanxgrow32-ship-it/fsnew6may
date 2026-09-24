import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Call list',
  robots: {
    index: false,
    follow: false,
    googleBot: {
      index: false,
      follow: false,
    },
  },
};

export default function LeadTerminalLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}