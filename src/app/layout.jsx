import "./globals.css";

export const metadata = {
  title: "LinguAI Bridge",
  description: "Computer-delivered IELTS listening practice",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>{children}</body>
    </html>
  );
}
