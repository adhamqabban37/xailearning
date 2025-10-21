"use client";
import React from "react";
import { CatalogItem } from "@/types/catalog";
import { extractYouTubeId, toEmbedUrl, normalizeYouTube } from "@/lib/urlTools";

function BrokenBadge() {
  return (
    <span className="ml-2 inline-flex items-center rounded bg-red-100 px-2 py-0.5 text-xs font-medium text-red-800 border border-red-200">
      Broken link
    </span>
  );
}

export default function VideoCard({ item }: { item: CatalogItem }) {
  const id = extractYouTubeId(item.url);
  const embed = item.normalizedUrl || (id ? toEmbedUrl(id) : undefined);
  const canonical = id ? normalizeYouTube(item.url) : item.url;
  const prefersReducedMotion =
    typeof window !== "undefined" &&
    window.matchMedia &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  return (
    <article className="card">
      <header className="flex items-center justify-between mb-2">
        <h3 className="text-lg font-semibold">{item.title}</h3>
        {item.broken ? <BrokenBadge /> : null}
      </header>

      <details className="mb-3 group" role="group">
        <summary className="cursor-pointer select-none focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 rounded px-1 py-0.5">
          Quick summary
        </summary>
        <div className="mt-2 text-sm text-gray-700 space-y-1">
          {item.summary ? (
            <p>
              <strong>What its about:</strong> {item.summary}
            </p>
          ) : null}
          {item.benefit ? (
            <p>
              <strong>How it helps:</strong> {item.benefit}
            </p>
          ) : null}
        </div>
      </details>

      {item.broken || !embed ? (
        <div className="text-sm text-gray-600">
          <p className="mb-2">
            We couldnt verify this video. You can still try opening it on
            YouTube.
          </p>
          <a
            className="text-primary-600 underline"
            href={canonical}
            target="_blank"
            rel="noopener noreferrer"
          >
            Open on YouTube
          </a>
        </div>
      ) : (
        <div className="aspect-video w-full overflow-hidden rounded border border-gray-200">
          <iframe
            src={embed}
            title={item.title}
            loading="lazy"
            className={prefersReducedMotion ? "motion-reduce" : ""}
            allow="accelerometer; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            referrerPolicy="strict-origin-when-cross-origin"
            allowFullScreen
          />
        </div>
      )}
    </article>
  );
}
