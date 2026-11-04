import "server-only";
import { prisma } from "@/lib/db";
import { sendEmail } from "@/lib/mailer";
import { CODE_TTL_MS, generateCode, hashCode, verificationEmail } from "@/lib/verification-core";

/**
 * Replaces any earlier code for this user with a fresh one and emails it.
 * `devCode` is set only outside production when the email could not be delivered, so local testing can still verify.
 */
export async function issueVerification(userId: string, email: string, name?: string | null): Promise<{ sent: boolean; devCode?: string }> {
  const code = generateCode();
  await prisma.$transaction([
    prisma.email_verifications.deleteMany({ where: { user_id: userId } }),
    prisma.email_verifications.create({ data: { user_id: userId, token_hash: hashCode(userId, code), expires_at: new Date(Date.now() + CODE_TTL_MS) } }),
  ]);
  const sent = await sendEmail({ to: email, ...verificationEmail(code, name) });
  return !sent && process.env.NODE_ENV !== "production" ? { sent, devCode: code } : { sent };
}
