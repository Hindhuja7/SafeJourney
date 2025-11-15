// pages/_document.js
import { Html, Head, Main, NextScript } from 'next/document'

export default function Document() {
  return (
    <Html lang="en">
      <Head>
        <meta name="application-name" content="SafeJourney" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="SafeJourney" />
        <meta name="description" content="Find safe routes and share live location with trusted contacts" />
        <meta name="format-detection" content="telephone=no" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="msapplication-TileColor" content="#7c3aed" />
        <meta name="msapplication-tap-highlight" content="no" />
        <meta name="theme-color" content="#7c3aed" />

        <link rel="apple-touch-icon" href="/icon-192.png" />
        <link rel="icon" type="image/png" sizes="32x32" href="/icon-192.png" />
        <link rel="icon" type="image/png" sizes="16x16" href="/icon-192.png" />
        <link rel="manifest" href="/manifest.json" />
        <link rel="mask-icon" href="/icon-192.png" color="#7c3aed" />
        <link rel="shortcut icon" href="/icon-192.png" />

        <meta name="twitter:card" content="summary" />
        <meta name="twitter:url" content="https://safejourney.app" />
        <meta name="twitter:title" content="SafeJourney" />
        <meta name="twitter:description" content="Find safe routes and share live location" />
        <meta name="twitter:image" content="/icon-512.png" />
        <meta name="twitter:creator" content="@safejourney" />
        <meta property="og:type" content="website" />
        <meta property="og:title" content="SafeJourney" />
        <meta property="og:description" content="Find safe routes and share live location with trusted contacts" />
        <meta property="og:site_name" content="SafeJourney" />
        <meta property="og:url" content="https://safejourney.app" />
        <meta property="og:image" content="/icon-512.png" />
      </Head>
      <body>
        <Main />
        <NextScript />
      </body>
    </Html>
  )
}