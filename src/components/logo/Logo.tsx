import React from "react";

import Image from "next/image";

export default function Logo(props: React.ComponentProps<"div">) {
  return (
    <div {...props}>
      <Image src="/logo.png" alt="Logo" width={40} height={40} priority />
    </div>
  );
}
