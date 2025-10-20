import "./globals.css";
import { fontBody, fontDisplay, fontInput } from "@/lib/fonts";

export const metadata = {
  title: "Waffles Game",
  description: "Waffles",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={`${fontBody.variable} ${fontDisplay.variable} ${fontInput.variable}`}
    >
      <body className="text-foreground bg-figma noise">{children}</body>
    </html>
  );
}
