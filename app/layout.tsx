import { Inter } from "next/font/google";
import "./globals.css";
import { Analytics } from '@vercel/analytics/next';
import { NotificationManager } from "../components/NotificationManager";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

export const metadata = {
  title: "Bondly — Connect with Anyone",
  description: "A premium, modern real-time chat application.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={inter.variable}>
      <body>
        <NotificationManager />
        {children}
        <Analytics />
      </body>
    </html>
  );
}
