import "server-only";
import { prisma } from "@/lib/db";
import { sendEmail } from "@/lib/mailer";
import { SITE_URL } from "@/lib/site";
import { generateToken, hashToken, VERIFY_TTL_MS, verificationEmail, verificationLink } from "@/lib/verification-core";

/** Replaces any earlier link for this user with a fresh one and emails it. Returns whether the email was sent. */
export async function issueVerification(userId: string, email: string): Promise<boolean> {
  const token = generateToken();
  await prisma.$transaction([
    prisma.email_verifications.deleteMany({ where: { user_id: userId } }),
    prisma.email_verifications.create({ data: { user_id: userId, token_hash: hashToken(token), expires_at: new Date(Date.now() + VERIFY_TTL_MS) } }),
  ]);
  return sendEmail({ to: email, ...verificationEmail(verificationLink(SITE_URL, token)) });
}
