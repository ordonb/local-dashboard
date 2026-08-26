import type { Metadata } from "next";
import type { ReactNode } from "react";

import "./globals.css";

export const metadata: Metadata = {
  title: "Incorta Security Dashboard",
  description: "Local security management dashboard proof of concept",
};

const contract = `THESIS: A sparse security performance wall prioritizes one decision—choose a management area—over generic dashboard chrome.
OWN-WORLD: Matte graphite, deep angular fields, warm white type, precision rules, and four restrained section accents.
STORY: Leadership sees unavailable scores honestly, chooses an area, selects a returned entity on a separate heatmap page, and reads raw KPI rows.
FIRST VIEWPORT: Oversized title and quiet score shell above four horizontal management lanes; a redesigned scale key anchors the lower field.
FORM: Dark architectural command wall, grounded direction 7, seed d04868cb.
FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance`;

export default function RootLayout({ children }: Readonly<{ children: ReactNode }>) {
  const injectContract = `document.currentScript.parentNode.insertBefore(document.createComment(${JSON.stringify(contract)}),document.currentScript);`;

  return (
    <html lang="en">
      <body>
        <script dangerouslySetInnerHTML={{ __html: injectContract }} />
        {children}
      </body>
    </html>
  );
}
