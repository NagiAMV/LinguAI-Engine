import "./globals.css";

export const metadata = {
  title: "LinguAI Bridge",
  description: "Vocabulary learning interface for LinguAI Bridge",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
