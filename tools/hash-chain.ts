import crypto from "crypto";

export const GENESIS_HASH =
  "0000000000000000000000000000000000000000000000000000000000000000";

/**
 * Calculates SHA-256 hash for a statement entry in the narrative chain:
 * SHA256(prevHash + narrator + body + createdAt)
 */
export function computeStatementHash(
  prevHash: string,
  narrator: string,
  body: string,
  createdAt: string
): string {
  const payload = `${prevHash.trim()}|${narrator.trim()}|${body.trim()}|${createdAt.trim()}`;
  return crypto.createHash("sha256").update(payload, "utf8").digest("hex");
}

export interface StatementHashItem {
  id?: string;
  hash: string;
  prev_hash: string;
  narrator: string;
  body: string;
  created_at: string;
}

export interface ChainVerificationResult {
  valid: boolean;
  brokenAtIndex?: number;
  error?: string;
  verifiedCount: number;
  chainDetails: Array<{
    index: number;
    narrator: string;
    hash: string;
    prevHash: string;
    expectedHash: string;
    isValid: boolean;
  }>;
}

/**
 * Verifies cryptographic integrity of a chronological sequence of statements.
 */
export function verifyHashChain(
  statements: StatementHashItem[]
): ChainVerificationResult {
  if (!statements || statements.length === 0) {
    return {
      valid: true,
      verifiedCount: 0,
      chainDetails: [],
    };
  }

  const chainDetails: ChainVerificationResult["chainDetails"] = [];

  for (let i = 0; i < statements.length; i++) {
    const current = statements[i];
    const expectedPrev = i === 0 ? GENESIS_HASH : statements[i - 1].hash;

    // Check link to previous
    if (i === 0) {
      // Genesis or first block should either link to GENESIS_HASH or maintain continuity
      if (current.prev_hash !== GENESIS_HASH && statements.length > 1) {
        // Warning if first block does not use genesis
      }
    } else {
      if (current.prev_hash !== expectedPrev) {
        return {
          valid: false,
          brokenAtIndex: i,
          error: `Broken linkage at index ${i}: prev_hash "${current.prev_hash}" does not match previous statement's hash "${expectedPrev}".`,
          verifiedCount: i,
          chainDetails,
        };
      }
    }

    const computed = computeStatementHash(
      current.prev_hash,
      current.narrator,
      current.body,
      current.created_at
    );

    const isMatch = computed === current.hash;
    chainDetails.push({
      index: i,
      narrator: current.narrator,
      hash: current.hash,
      prevHash: current.prev_hash,
      expectedHash: computed,
      isValid: isMatch,
    });

    if (!isMatch) {
      return {
        valid: false,
        brokenAtIndex: i,
        error: `Cryptographic tamper detected at index ${i}: Hash mismatch. Expected "${computed}" but recorded "${current.hash}".`,
        verifiedCount: i,
        chainDetails,
      };
    }
  }

  return {
    valid: true,
    verifiedCount: statements.length,
    chainDetails,
  };
}
