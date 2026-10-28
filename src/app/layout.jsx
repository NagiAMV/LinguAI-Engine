import "./globals.css";
import AccountProvider from '@/components/account/AccountProvider';
import '@/components/account/account.css';

export const metadata = {
  title: "LinguAI Bridge",
  description: "Computer-delivered IELTS listening practice",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body><AccountProvider>{children}</AccountProvider></body>
    </html>
  );
}
