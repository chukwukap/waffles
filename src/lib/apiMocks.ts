export async function validateInviteCode(
  code: string
): Promise<{ valid: boolean; message?: string }> {
  // Simulate network delay
  await new Promise((res) => setTimeout(res, 500));
  const validCodes = ["WAFF"]; // sample valid codes
  const normalized = code.trim().toUpperCase();
  if (validCodes.includes(normalized)) {
    return { valid: true };
  } else {
    return { valid: false, message: "Invite code not found" };
  }
}

export async function purchaseWaffle(
  typeId: string
): Promise<{ ticketId: number; waffleType: string; message: string }> {
  // Simulate network delay
  await new Promise((res) => setTimeout(res, 800));
  // Return a dummy ticket
  return {
    ticketId: Math.floor(Math.random() * 1000000),
    waffleType: typeId,
    message: "Purchase successful",
  };
}
