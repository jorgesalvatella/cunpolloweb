import Openpay from "openpay";

const merchantId = process.env.OPENPAY_MERCHANT_ID!;
const privateKey = process.env.OPENPAY_PRIVATE_KEY!;
const isSandbox = process.env.NEXT_PUBLIC_OPENPAY_SANDBOX === "true";

const openpay = new Openpay(merchantId, privateKey, !isSandbox);
openpay.setTimeout(30000);

type ChargeResult = {
  success: boolean;
  chargeId?: string;
  error?: string;
  redirectUrl?: string;
  status?: string;
};

type RefundResult = {
  success: boolean;
  refundId?: string;
  error?: string;
};

export async function refundCharge(
  chargeId: string,
  description: string
): Promise<RefundResult> {
  return new Promise((resolve) => {
    openpay.charges.refund(
      chargeId,
      { description },
      (error: unknown, refund: { id?: string }) => {
        if (error) {
          const err = error as { description?: string; error_code?: number };
          console.error("Openpay refund error:", {
            chargeId,
            error_code: err.error_code,
            description: err.description,
          });
          resolve({
            success: false,
            error: err.description || "Error al procesar el reembolso",
          });
          return;
        }
        resolve({ success: true, refundId: refund.id });
      }
    );
  });
}

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

type BankChargeResult = {
  success: boolean;
  chargeId?: string;
  speiDetails?: {
    clabe: string;
    bank: string;
    agreement: string;
    name: string;
  };
  error?: string;
};

export async function createBankCharge({
  amount,
  description,
  orderId,
  customerName,
  customerEmail,
  customerPhone,
}: {
  amount: number;
  description: string;
  orderId: string;
  customerName: string;
  customerEmail?: string;
  customerPhone?: string;
}): Promise<BankChargeResult> {
  return new Promise((resolve) => {
    const nameParts = customerName.trim().split(/\s+/);
    const firstName = nameParts[0] || "Cliente";
    const lastName = nameParts.slice(1).join(" ") || "CUNPOLLO";

    const chargeRequest = {
      method: "bank_account",
      amount: parseFloat(amount.toFixed(2)),
      description,
      order_id: orderId,
      customer: {
        name: firstName,
        last_name: lastName,
        phone_number: customerPhone || "9981488987",
        email: customerEmail || "cliente@cunpollo.com",
      },
    };

    openpay.charges.create(
      chargeRequest,
      (
        error: unknown,
        charge: {
          id?: string;
          status?: string;
          payment_method?: {
            clabe?: string;
            bank?: string;
            agreement?: string;
            name?: string;
          };
        }
      ) => {
        if (error) {
          const err = error as {
            description?: string;
            error_code?: number;
            http_code?: number;
          };
          console.error("Openpay SPEI charge error:", {
            orderId,
            error_code: err.error_code,
            http_code: err.http_code,
            description: err.description,
          });
          resolve({
            success: false,
            error: err.description || "Error al generar referencia SPEI",
          });
          return;
        }

        const pm = charge.payment_method;
        resolve({
          success: true,
          chargeId: charge.id,
          speiDetails: pm
            ? {
                clabe: pm.clabe || "",
                bank: pm.bank || "",
                agreement: pm.agreement || "",
                name: pm.name || "",
              }
            : undefined,
        });
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
