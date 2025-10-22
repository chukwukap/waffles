import DeviceGate from "@/components/DeviceGate";
import "./globals.css";
import { fontBody, fontDisplay, fontInput } from "@/lib/fonts";
import "./globals.css";
import WalletProvider from "@/components/providers/WalletProvider";
import FarcasterProvider from "@/components/providers/FarcasterProvider";
import GlobalToaster from "@/components/ui/Toaster";

export const metadata = {
  title: "Waffles Game ",
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
      <body className="text-foreground bg-figma noise">
        <DeviceGate continueAnyway={process.env.NODE_ENV == "production"}>
          <WalletProvider>
            <FarcasterProvider>{children}</FarcasterProvider>
          </WalletProvider>
        </DeviceGate>
        <GlobalToaster />
      </body>
    </html>
  );
}
