import type { Metadata } from 'next';
import 'react-datepicker/dist/react-datepicker.css';
import './globals.css';

export const metadata: Metadata = {
  title: 'Krishna Printers CRM',
  description: 'Krishna Printers CRM Web Application',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
