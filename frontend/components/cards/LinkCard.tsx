"use client";
import React from "react";
import { CatalogItem } from "@/types/catalog";

function ExternalIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      className="h-4 w-4 inline-block ml-1"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth="2"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M13 7h6m0 0v6m0-6L10 16"
      />
    </svg>
  );
}

function BrokenBadge() {
  return (
    <span className="ml-2 inline-flex items-center rounded bg-red-100 px-2 py-0.5 text-xs font-medium text-red-800 border border-red-200">
      Broken link
    </span>
  );
}

export default function LinkCard({
  item,
  mirror,
}: {
  item: CatalogItem;
  mirror?: string;
}) {
  const url = item.url;
  return (
    <article className="card">
      <header className="flex items-center justify-between mb-2">
        <h3 className="text-lg font-semibold flex items-center">
          {item.title}
          <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary-600 ml-2 underline"
          >
            Visit <ExternalIcon />
          </a>
        </h3>
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

      {item.broken && (mirror || item.mirrors?.length) ? (
        <div>
          <a
            href={mirror || item.mirrors?.[0]}
            target="_blank"
            rel="noopener noreferrer"
            className="btn-secondary"
          >
            Try mirror
          </a>
        </div>
      ) : null}
    </article>
  );
}
