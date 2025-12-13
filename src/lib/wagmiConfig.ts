import { createConfig, http } from "wagmi";
import { base, baseSepolia } from "viem/chains";
import { injected } from "wagmi/connectors";

export const wagmiConfig = createConfig({
  chains: [base, baseSepolia],
  transports: {
    [base.id]: http(),
    [baseSepolia.id]: http(),
  },
  connectors: [injected()],
  ssr: true,
});
