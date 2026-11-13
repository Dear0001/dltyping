import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/site";

const ROUTES = ["", "/learn", "/games", "/library", "/pets", "/help", "/support", "/support/contact", "/support/feedback", "/support/report", "/test", "/daily", "/privacy", "/terms",
  "/games/space-shooter", "/games/car-racing", "/games/zombie-survival", "/games/battle-arena", "/games/letter-jump", "/games/english-quest", "/games/sentence-rush", "/games/mario-khmer-quest", "/games/word-sprint"];

export default function sitemap(): MetadataRoute.Sitemap {
  return ROUTES.map((path) => ({
    url: `${SITE_URL}${path}`,
    lastModified: new Date(),
    changeFrequency: path === "" ? "weekly" : "monthly",
    priority: path === "" ? 1 : 0.7,
  }));
}
