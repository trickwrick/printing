import type { Metadata } from 'next';
import 'react-datepicker/dist/react-datepicker.css';
import './globals.css';

export const metadata: Metadata = {
  title: 'Shree Om Printing Press CRM',
  description: 'Shree Om Printing Press CRM Web Application',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
