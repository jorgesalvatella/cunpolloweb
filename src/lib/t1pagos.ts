// T1 Pagos (ClaroPagos) API wrapper — server-only
// Docs: https://docs.t1pagos.com/docs/cargo-tarjeta.html

const T1_BASE_URL =
  process.env.T1_PAGOS_BASE_URL || "https://api.sandbox.claropagos.com/v1";
const T1_BEARER_TOKEN = process.env.T1_PAGOS_BEARER_TOKEN!;

// ------------------------------------------------------------------
// Types — ClaroPagos response wrapper
// ------------------------------------------------------------------

type T1Response<T> = {
  status: "success" | "fail" | "error";
  http_code: number;
  data: T;
  datetime: string;
  timestamp: number;
  error?: {
    code: string;
    type: string;
    message: string;
  };
};

// ------------------------------------------------------------------
// Tokenization types
// ------------------------------------------------------------------

export type TokenizeCardParams = {
  number: string;
  expMonth: string;
  expYear: string;
  cvv: string;
  holderName: string;
};

type TokenizeData = {
  token: string;
  marca: string;
  terminacion: string;
  iin: string;
  nombre: string;
  expiracion_mes: string;
  expiracion_anio: string;
};

export type TokenizeResult = {
  token: string;
  brand: string;
  last4: string;
};

// ------------------------------------------------------------------
// Charge types
// ------------------------------------------------------------------

export type ChargeParams = {
  token: string;
  amount: number; // pesos MXN (NOT centavos)
  description: string;
  orderId: string;
  deviceFingerprint?: string;
};

type ChargeData = {
  id: string;
  monto: number;
  estatus: string;
  codigo: string;
  descripcion: string;
  orden_id: string;
  tarjeta: {
    marca: string;
    terminacion: string;
  };
};

export type ChargeResult = {
  id: string;
  status: string;
};

// ------------------------------------------------------------------
// Internal fetch helper
// ------------------------------------------------------------------

async function t1Fetch<T>(
  endpoint: string,
  body: Record<string, unknown>
): Promise<T1Response<T>> {
  const res = await fetch(`${T1_BASE_URL}${endpoint}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${T1_BEARER_TOKEN}`,
    },
    body: JSON.stringify(body),
  });

  const json: T1Response<T> = await res.json();

  if (json.status !== "success") {
    const msg = json.error?.message || `status: ${json.status}`;
    throw new Error(`T1 Pagos (${json.http_code}): ${msg}`);
  }

  return json;
}

// ------------------------------------------------------------------
// Public API
// ------------------------------------------------------------------

/**
 * Tokenize a card via POST /v1/tarjeta
 * Returns a token that can be used for charges.
 */
export async function tokenizeCard(
  params: TokenizeCardParams
): Promise<TokenizeResult> {
  const res = await t1Fetch<TokenizeData>("/tarjeta", {
    nombre: params.holderName,
    pan: params.number.replace(/\s/g, ""),
    expiracion_mes: params.expMonth.padStart(2, "0"),
    expiracion_anio: params.expYear,
    cvv2: params.cvv,
  });

  return {
    token: res.data.token,
    brand: res.data.marca,
    last4: res.data.terminacion,
  };
}

/**
 * Create a charge via POST /v1/cargo
 * Amount is in MXN pesos (e.g. 250.00), NOT centavos.
 */
export async function createCharge(
  params: ChargeParams
): Promise<ChargeResult> {
  const pedido: Record<string, unknown> = {
    id_externo: params.orderId,
  };
  if (params.deviceFingerprint) {
    pedido.device_fingerprint = params.deviceFingerprint;
  }

  const res = await t1Fetch<ChargeData>("/cargo", {
    monto: params.amount,
    moneda: "MXN",
    descripcion: params.description,
    metodo_pago: "tarjeta",
    capturar: true,
    tarjeta: {
      token: params.token,
    },
    pedido,
  });

  return {
    id: res.data.id,
    status: res.data.estatus,
  };
}
