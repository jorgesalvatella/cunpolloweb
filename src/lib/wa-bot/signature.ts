import crypto from "crypto";

/**
 * Validates the X-Twilio-Signature header for incoming webhooks.
 * Algorithm: HMAC-SHA1 over (url + sorted form params concatenated as key+value),
 * base64 encoded, compared against the signature header.
 * https://www.twilio.com/docs/usage/security#validating-requests
 */
export function validateTwilioSignature(
  url: string,
  params: Record<string, string>,
  signature: string | null
): boolean {
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  if (!authToken || !signature) return false;

  const data =
    url +
    Object.keys(params)
      .sort()
      .map((key) => key + params[key])
      .join("");

  const expected = crypto
    .createHmac("sha1", authToken)
    .update(Buffer.from(data, "utf-8"))
    .digest("base64");

  const a = Buffer.from(expected);
  const b = Buffer.from(signature);
  if (a.length !== b.length) return false;
  return crypto.timingSafeEqual(a, b);
}
