import type { Metadata } from "next";
import { Roboto } from "next/font/google";
import "@/shared/styles/global.css";

const roboto = Roboto({
  variable: "--font-roboto",
  weight: ["400", "500", "600"],
  subsets: ["latin", "latin-ext"],
});

export const metadata: Metadata = {
  title: "CV Builder",
  description: "Create, edit and preview CVs.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={roboto.variable}>
      <body>{children}</body>
    </html>
  );
}
