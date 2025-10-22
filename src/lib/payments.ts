import { writeContract } from "wagmi/actions";
import { parseUnits } from "viem";
import { base } from "wagmi/chains";

const WAFFLES_RECEIVER = process.env.NEXT_PUBLIC_RECEIVER_ADDRESS!; // EOA receiving funds
const USDC_ADDRESS = process.env.NEXT_PUBLIC_USDC_ADDRESS!; // Base USDC token address

export async function sendUSDC(amount: string) {
  const value = parseUnits(amount, 6);
  const tx = await writeContract({
    address: USDC_ADDRESS,
    abi: ["function transfer(address to, uint256 value) public returns (bool)"],
    functionName: "transfer",
    args: [WAFFLES_RECEIVER, value],
    chainId: base.id,
  });
  return tx.hash;
}
