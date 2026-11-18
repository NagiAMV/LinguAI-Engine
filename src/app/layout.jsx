import "./globals.css";
import AccountProvider from '@/components/account/AccountProvider';
import ContextMenuGuard from '@/components/ContextMenuGuard';
import AnonymousAnalytics from '@/components/AnonymousAnalytics';
import '@/components/account/account.css';
import '@/components/writing/writing.css';
import '@/components/speaking-hub.css';

export const metadata = {
  title: "LinguAI Bridge",
  description: "Computer-delivered IELTS listening practice",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body><ContextMenuGuard/><AnonymousAnalytics/><AccountProvider>{children}</AccountProvider></body>
    </html>
  );
}
