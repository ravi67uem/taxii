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
        <link 
          rel="stylesheet" 
          href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" 
          integrity="sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY=" 
          crossOrigin="" 
        />
      </head>
      <body>
        {children}
        <Script
          src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"
          integrity="sha256-20nQCchB9co0qIjJZRGuk2/Z9VM+kNiyxNV1lvTlZBo="
          crossOrigin=""
          strategy="beforeInteractive"
        />
        <Script
          src="https://checkout.razorpay.com/v1/checkout.js"
          strategy="lazyOnload"
        />
      </body>
    </html>
  );
}
