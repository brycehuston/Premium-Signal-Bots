/** Explicit release gate for manual Solana USDC subscriptions.
 * No default wallet, no automatic activation, and no payment instructions for unavailable plans.
 */
export const UNAVAILABLE_PAID_SLUGS = new Set(["alpha-early-alerts", "alpha-bundle"]);

const BASE58 = "123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz";

export function isValidSolanaReceiver(input: string): boolean {
  if (!/^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(input)) return false;
  // Decode base58 to verify 32 bytes, not just an alphabet/length match.
  const bytes = [0];
  for (const letter of input) {
    let carry = BASE58.indexOf(letter);
    if (carry < 0) return false;
    for (let i = 0; i < bytes.length; i++) {
      carry += bytes[i] * 58;
      bytes[i] = carry & 255;
      carry = Math.floor(carry / 256);
    }
    while (carry > 0) {
      bytes.push(carry & 255);
      carry = Math.floor(carry / 256);
    }
  }
  const zeroPrefix = input.match(/^1*/)?.[0].length ?? 0;
  const payloadLength = bytes.length === 1 && bytes[0] === 0 ? 0 : bytes.length;
  return zeroPrefix + payloadLength === 32 && payloadLength > 0;
}

export function getManualCheckoutGate(slug: string): {
  enabled: boolean; receiver: string; reason: string;
} {
  if (UNAVAILABLE_PAID_SLUGS.has(slug)) {
    return { enabled: false, receiver: "", reason: "This package is not currently available for new subscriptions." };
  }
  // Explicit operator opt-in. Never infer checkout readiness from a rendered page.
  if (process.env.ALPHA_MANUAL_CHECKOUT_ENABLED !== "true") {
    return { enabled: false, receiver: "", reason: "Manual checkout is temporarily unavailable. Please check back later." };
  }
  // Server-only receiver address. A valid address does NOT establish ownership;
  // the operator must independently verify that before enabling the gate.
  const receiver = process.env.ALPHA_MANUAL_CHECKOUT_RECEIVER ?? "";
  if (!isValidSolanaReceiver(receiver)) {
    return { enabled: false, receiver: "", reason: "Manual checkout is temporarily unavailable. Please check back later." };
  }
  return { enabled: true, receiver, reason: "" };
}
