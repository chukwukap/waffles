import { createConfig, http } from "wagmi";
import { base } from "viem/chains";
import { injected } from "wagmi/connectors";

export const wagmiConfig = createConfig({
  chains: [base],
  transports: {
    [base.id]: http(),
  },
  connectors: [injected()],
  ssr: true,
});
