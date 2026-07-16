import Script from 'next/script';
import "./globals.css";

export const metadata = {
  title: "Taxii | Premium Electric Taxi Service in Bihar",
  description: "Bihar's first premium, 100% electric smart taxi service. Zero noise, zero emissions, transparent pricing, and professional local drivers in Patna, Gaya, Bodhgaya & Nalanda. Secure your early access now!",
  keywords: "Taxii, Premium taxi Bihar, cab Patna, Taxii Chauffeur, Gaya electric taxi, clean rides Bodhgaya, early access taxi Bihar, Nalanda green cabs",
  authors: [{ name: "Taxii Team" }],
  icons: {
    icon: '/favicon.ico',
  }
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      </head>
      <body>
        {children}
        <Script
          src={`https://maps.googleapis.com/maps/api/js?key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}&libraries=places`}
          strategy="beforeInteractive"
        />
      </body>
    </html>
  );
}
