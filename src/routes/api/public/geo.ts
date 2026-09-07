import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/public/geo")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const url = new URL(request.url);
        const q = (url.searchParams.get("q") ?? "").trim();
        if (q.length < 2) return Response.json([]);
        const target = `https://nominatim.openstreetmap.org/search?format=jsonv2&addressdetails=1&limit=8&q=${encodeURIComponent(q)}`;
        try {
          const res = await fetch(target, {
            headers: { "User-Agent": "NAMAANK/1.0 (numerology app)", Accept: "application/json" },
          });
          if (!res.ok) return Response.json([]);
          const data = (await res.json()) as Array<{
            display_name: string;
            lat: string;
            lon: string;
            address?: Record<string, string>;
          }>;
          return Response.json(
            data.map((d) => ({
              label: d.display_name,
              lat: Number(d.lat),
              lon: Number(d.lon),
              country: d.address?.["country_code"]?.toUpperCase() ?? "",
            })),
          );
        } catch {
          return Response.json([]);
        }
      },
    },
  },
});
