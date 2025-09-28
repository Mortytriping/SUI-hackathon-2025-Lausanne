import "@mysten/dapp-kit/dist/index.css";
import "./globals.css";
import { Providers } from "./providers";
import { ThemeProvider } from "./components/ThemeProvider";
import Navbar from "./components/Navbar";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <meta charSet="UTF-8" />
        <link rel="icon" type="image/svg+xml" href="/logo.png" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>Sui dApp Starter</title>
      </head>
      <body>
        <Providers>
          <ThemeProvider>
            <Navbar />
            <div className="min-h-screen bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 transition-colors duration-200">
              {children}
            </div>
          </ThemeProvider>
        </Providers>
      </body>
    </html>
  );
}