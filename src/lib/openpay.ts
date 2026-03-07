import Openpay from "openpay";

const merchantId = process.env.OPENPAY_MERCHANT_ID!;
const privateKey = process.env.OPENPAY_PRIVATE_KEY!;
const isSandbox = process.env.NEXT_PUBLIC_OPENPAY_SANDBOX === "true";

const openpay = new Openpay(merchantId, privateKey, "mx", !isSandbox);
openpay.setTimeout(30000);

type ChargeResult = {
  success: boolean;
  chargeId?: string;
  error?: string;
  redirectUrl?: string;
  status?: string;
};

export async function getCharge(chargeId: string): Promise<{ status?: string; error?: string }> {
  return new Promise((resolve) => {
    openpay.charges.get(
      chargeId,
      (error: unknown, charge: { status?: string }) => {
        if (error) {
          const err = error as { description?: string };
          resolve({ error: err.description || "Error al verificar el cobro" });
          return;
        }
        resolve({ status: charge.status });
      }
    );
  });
}

export async function createCharge({
  tokenId,
  deviceSessionId,
  amount,
  description,
  orderId,
  customerName,
  customerEmail,
  redirectUrl,
}: {
  tokenId: string;
  deviceSessionId: string;
  amount: number;
  description: string;
  orderId: string;
  customerName: string;
  customerEmail?: string;
  redirectUrl: string;
}): Promise<ChargeResult> {
  return new Promise((resolve) => {
    const chargeRequest = {
      method: "card",
      source_id: tokenId,
      amount: parseFloat(amount.toFixed(2)),
      currency: "MXN",
      description,
      order_id: orderId,
      device_session_id: deviceSessionId,
      redirect_url: redirectUrl,
      customer: {
        name: customerName,
        email: customerEmail || "cliente@cunpollo.com",
      },
    };

    openpay.charges.create(
      chargeRequest,
      (error: unknown, charge: { id?: string; status?: string; payment_method?: { url?: string } }) => {
        if (error) {
          const err = error as {
            description?: string;
            error_code?: number;
            http_code?: number;
          };
          console.error("Openpay charge error:", {
            orderId,
            error_code: err.error_code,
            http_code: err.http_code,
            description: err.description,
          });
          resolve({
            success: false,
            error: err.description || "Error al procesar el pago",
          });
          return;
        }

        const needs3ds = charge.status === "charge_pending" && charge.payment_method?.url;
        resolve({
          success: true,
          chargeId: charge.id,
          status: charge.status,
          redirectUrl: needs3ds ? charge.payment_method!.url : undefined,
        });
      }
    );
  });
}
