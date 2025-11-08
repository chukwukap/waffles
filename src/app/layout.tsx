import "./globals.css";
import { fontBody, fontDisplay, fontInput } from "@/lib/fonts";

import { cn } from "@/lib/utils";

import { Providers } from "@/components/providers/";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={cn(
        fontBody.variable,
        fontDisplay.variable,
        fontInput.variable,
        "suppress-hydration-warning"
      )}
      suppressHydrationWarning
    >
      <body
        className={cn(
          "text-foreground app-background relative h-full overflow-hidden"
        )}
      >
        <Providers>
          <div className="h-dvh flex flex-col overflow-hidden">{children}</div>
        </Providers>
      </body>
    </html>
  );
}
