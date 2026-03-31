import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Road to Mastock",
    short_name: "Mastock",
    description: "Track your gym sessions",
    start_url: "/",
    display: "standalone",
    background_color: "#1a1310",
    theme_color: "#FE6B00",
    icons: [
      {
        src: "/icon.svg",
        sizes: "any",
        type: "image/svg+xml",
      },
      {
        src: "/icon",
        sizes: "192x192",
        type: "image/png",
      },
    ],
  };
}
