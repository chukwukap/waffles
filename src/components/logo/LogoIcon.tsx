import React from "react";

// Use next/image for optimal .png rendering in Next.js apps.
import Image from "next/image";

// You must provide the image file at the given path in your project.
export default function LogoIcon(props: React.ComponentProps<"div">) {
  return (
    <div {...props}>
      <Image src="/logo-icon.png" alt="Logo" width={100} height={40} priority />
    </div>
  );
}
