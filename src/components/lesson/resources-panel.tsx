"use client";

import type { Resource } from "@/lib/types";
import { YouTubeEmbed } from "./youtube-embed";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Link } from "lucide-react";
import { useEffect } from "react";

export function ResourcesPanel({ resources }: { resources: Resource[] }) {
  useEffect(() => {
    console.log("📚 ResourcesPanel received resources:", resources);
  }, [resources]);

  if (!resources || resources.length === 0) {
    return null;
  }

  // Separate videos from other resources based on type OR URL content
  // Filter out resources without valid URLs
  const validResources = resources.filter((r) => {
    if (!r.url || typeof r.url !== "string" || r.url.trim() === "") {
      console.warn("⚠️ Resource missing URL:", r);
      return false;
    }
    return true;
  });

  const youtubeLinks = validResources.filter(
    (r) =>
      r.type === "video" ||
      r.url.includes("youtube.com") ||
      r.url.includes("youtu.be")
  );
  const otherLinks = validResources.filter(
    (r) =>
      r.type !== "video" &&
      !r.url.includes("youtube.com") &&
      !r.url.includes("youtu.be")
  );

  console.log(
    "📹 Found",
    youtubeLinks.length,
    "YouTube videos and",
    otherLinks.length,
    "other links"
  );

  return (
    <Card className="mt-4 bg-secondary/50">
      <CardHeader>
        <CardTitle className="text-lg flex items-center">
          <Link className="w-5 h-5 mr-2" />
          Additional Resources
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {youtubeLinks.length > 0 && (
          <div className="space-y-4">
            <h3 className="text-sm font-medium text-muted-foreground">
              Video Resources
            </h3>
            {youtubeLinks.map((resource, index) => (
              <div key={`yt-${index}`} className="space-y-2">
                <h4 className="font-semibold text-sm">{resource.title}</h4>
                <YouTubeEmbed url={resource.url} />
              </div>
            ))}
          </div>
        )}

        {otherLinks.length > 0 && (
          <div className="space-y-2">
            <h3 className="text-sm font-medium text-muted-foreground">
              Additional Links
            </h3>
            <ul className="space-y-2">
              {otherLinks.map((resource, index) => (
                <li key={`link-${index}`} className="text-sm">
                  <a
                    href={resource.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary hover:underline transition-colors"
                  >
                    {resource.title}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
