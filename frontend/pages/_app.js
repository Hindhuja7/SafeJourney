// pages/_app.js
import { useEffect } from "react";
import Head from "next/head";
import Script from "next/script";
import "../styles/globals.css";
// Import MapLibre CSS (required for maps)
import "maplibre-gl/dist/maplibre-gl.css";

export default function MyApp({ Component, pageProps }) {
  useEffect(() => {
    // Register service worker for PWA
    if (typeof window !== "undefined" && "serviceWorker" in navigator) {
      navigator.serviceWorker
        .register("/sw.js")
        .catch((error) => {
          // Silently fail - service worker is optional
        });
    }
    
    // MapLibre is already available from the import above
    // We don't need to load it dynamically since it's a regular npm package
    if (typeof window !== "undefined" && window.maplibregl) {
      window.ttMapsSDKReady = true;
      window.dispatchEvent(new Event('tomtom-sdk-ready'));
    }
  }, []);

  return (
    <>
      <Head>
        <title>SafeJourney - Your Personal Safety Companion</title>
        <meta name="description" content="Real-time location sharing, SOS alerts, and safety features for your journeys" />
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no" />
        <link rel="icon" href="/favicon.ico" />
        <meta name="theme-color" content="#6366f1" />
      </Head>
      
      {/* Fallback check script - MapLibre should be available via import */}
      <Script
        id="maplibre-check"
        strategy="afterInteractive"
        dangerouslySetInnerHTML={{
          __html: `
            (function() {
              if (window.maplibregl) {
                window.ttMapsSDKReady = true;
                window.dispatchEvent(new Event('tomtom-sdk-ready'));
              }
            })();
          `
        }}
      />
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
        <Component {...pageProps} />
      </div>
    </>
  );
}