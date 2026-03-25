import "./globals.css";

export const metadata = {
  title: "Frammer AI Dashboard",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}