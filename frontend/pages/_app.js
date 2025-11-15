import { useEffect } from "react";
import Head from "next/head";
import Script from "next/script";
import "../styles/globals.css";
import "leaflet/dist/leaflet.css";

export default function MyApp({ Component, pageProps }) {
  useEffect(() => {
    // Register service worker for PWA
    if (typeof window !== "undefined" && "serviceWorker" in navigator) {
      navigator.serviceWorker
        .register("/sw.js")
        .then((registration) => {
          console.log("Service Worker registered:", registration);
        })
        .catch((error) => {
          console.log("Service Worker registration failed:", error);
        });
    }
  }, []);

  return (
    <>
      <Head>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no" />
        {/* TomTom Maps SDK */}
        <link rel='stylesheet' type='text/css' href='https://api.tomtom.com/maps-sdk-for-web/cdn/6.x/6.25.0/maps/maps.css'/>
      </Head>
      {/* Load TomTom Maps SDK */}
      <Script
        src='https://api.tomtom.com/maps-sdk-for-web/cdn/6.x/6.25.0/maps/maps-web.min.js'
        strategy="beforeInteractive"
        onLoad={() => {
          console.log('TomTom Maps SDK loaded');
        }}
      />
      <Component {...pageProps} />
    </>
  );
}
