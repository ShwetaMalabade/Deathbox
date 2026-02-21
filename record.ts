import {
  Connection,
  Keypair,
  PublicKey,
  Transaction,
  TransactionInstruction,
  sendAndConfirmTransaction,
} from "@solana/web3.js";
import fs from "fs";
import crypto from "crypto";

const RPC = process.env.RPC_URL ?? "http://127.0.0.1:8899";
const MEMO_PROGRAM_ID = new PublicKey("MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr");

function loadKeypair(path: string): Keypair {
  const secret = JSON.parse(fs.readFileSync(path, "utf8"));
  return Keypair.fromSecretKey(Uint8Array.from(secret));
}

function sha256Hex(input: string): string {
  return crypto.createHash("sha256").update(input).digest("hex");
}

async function writeMemo(payer: Keypair, memo: string) {
  const connection = new Connection(RPC, "confirmed");

  const ix = new TransactionInstruction({
    programId: MEMO_PROGRAM_ID,
    keys: [],
    data: Buffer.from(memo, "utf8"),
  });

  const tx = new Transaction().add(ix);
  const sig = await sendAndConfirmTransaction(connection, tx, [payer], { commitment: "confirmed" });
  console.log("signature:", sig);
  console.log("memo:", memo);
  return sig;
}

async function main() {
  // Usage:
  // node scripts/record.ts signup ./keys/userA.json user_123 payload.json
  // node scripts/record.ts share  ./keys/userA.json user_123 user_999 data_abc payload.json

  const [kind, keyPath, ...rest] = process.argv.slice(2);
  if (!kind || !keyPath) throw new Error("Missing args");

  const payer = loadKeypair(keyPath);
  const now = new Date().toISOString();

  if (kind === "signup") {
    const [userId, payloadPath] = rest;
    if (!userId || !payloadPath) throw new Error("signup requires: userId payloadPath");

    const payload = fs.readFileSync(payloadPath, "utf8");
    const hash = sha256Hex(payload);

    const memo = `DEATHBOX|signup|${userId}|${hash}|${now}`;
    await writeMemo(payer, memo);
    return;
  }

  if (kind === "share") {
    const [fromUserId, toUserId, dataId, payloadPath] = rest;
    if (!fromUserId || !toUserId || !dataId || !payloadPath) {
      throw new Error("share requires: fromUserId toUserId dataId payloadPath");
    }

    const payload = fs.readFileSync(payloadPath, "utf8");
    const hash = sha256Hex(payload);

    const memo = `DEATHBOX|share|from=${fromUserId}|to=${toUserId}|data=${dataId}|${hash}|${now}`;
    await writeMemo(payer, memo);
    return;
  }

  throw new Error(`Unknown kind: ${kind}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});