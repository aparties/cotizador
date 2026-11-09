import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "QuickQuote Industrial - Bicode Control",
  description: "Cotizador ágil de repuestos industriales y landed cost para Perú",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body className="antialiased bg-[#0b241c] text-white min-h-screen">
        {children}
      </body>
    </html>
  );
}

