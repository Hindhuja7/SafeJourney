import dynamic from "next/dynamic";
const MapViewClient = dynamic(() => import("./MapViewClient"), { ssr: false });
export default MapViewClient;
