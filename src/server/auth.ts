import { NextRequest } from "next/server";
import { getPrivyClient } from "./treasury";

export interface AuthenticatedUser {
  userId: string;
  walletAddress: string;
}

export async function authenticateRequest(
  req: NextRequest
): Promise<AuthenticatedUser | null> {
  const authHeader = req.headers.get("authorization");
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return null;
  }

  const token = authHeader.replace("Bearer ", "").trim();
  if (!token) return null;

  try {
    const privy = getPrivyClient();
    // 1. Verify token signature and claims via Privy server SDK
    const verifiedClaims = await privy.verifyAuthToken(token);
    if (!verifiedClaims || !verifiedClaims.userId) {
      return null;
    }

    // 2. Fetch user profile to extract linked wallet address
    const user = await privy.getUser(verifiedClaims.userId);
    if (!user) return null;

    // Search for active wallet address
    let walletAddress: string | null = null;
    if (user.wallet && user.wallet.address) {
      walletAddress = user.wallet.address;
    } else if (user.linkedAccounts && user.linkedAccounts.length > 0) {
      const walletAccount = user.linkedAccounts.find(
        (acc: any) => acc.type === "wallet" && acc.address
      );
      if (walletAccount && "address" in walletAccount) {
        walletAddress = (walletAccount as any).address;
      }
    }

    if (!walletAddress) {
      return null;
    }

    return {
      userId: verifiedClaims.userId,
      walletAddress: walletAddress.toLowerCase(),
    };
  } catch (err) {
    console.warn("Privy token verification failed:", err);
    return null;
  }
}
