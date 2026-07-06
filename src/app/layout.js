import "./globals.css";

export const metadata = {
  title: "Magadh EV Cabs | Premium Electric Taxi Service in Bihar",
  description: "Magadh region's first premium, 100% electric smart taxi service. Zero noise, zero emissions, transparent pricing, and professional local drivers in Patna, Gaya, Bodhgaya & Nalanda. Secure your early access now!",
  keywords: "EV taxi Bihar, electric cab Patna, Magadh EV, Gaya electric taxi, clean rides Bodhgaya, early access taxi Bihar, Nalanda green cabs",
  authors: [{ name: "Magadh EV Cabs Team" }],
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
      </body>
    </html>
  );
}
