// T1 Pagos API wrapper — server-only
// Docs: https://docs.t1pagos.com/docs/t1pagos_documentation.html

const T1_BASE_URL =
  process.env.T1_PAGOS_BASE_URL || "https://api.sandbox.t1pagos.com/v2";
const T1_API_KEY = process.env.T1_PAGOS_API_KEY!;

// ------------------------------------------------------------------
// Types — T1 Pagos response wrapper
// ------------------------------------------------------------------

type T1Response<T> = {
  status: "success" | "fail" | "error";
  http_code: number;
  data: T;
  datetime?: string;
  timestamp?: number;
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
  tarjeta: {
    token: string;
    pan: string;
    marca: string;
    terminacion: string;
    iin: string;
    cliente_id: string;
  };
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
  deviceFingerprint: string;
};

type ChargeData = {
  cargo: {
    id: string;
    monto: string;
    estatus: string;
    codigo: string;
    descripcion: string;
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
      "X-API-Key": T1_API_KEY,
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
 * Tokenize a card via POST /v2/tarjeta
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
    token: res.data.tarjeta.token,
    brand: res.data.tarjeta.marca,
    last4: res.data.tarjeta.terminacion,
  };
}

/**
 * Create a charge via POST /v2/cargo
 * Amount is in MXN pesos (e.g. 250.00), NOT centavos.
 */
export async function createCharge(
  params: ChargeParams
): Promise<ChargeResult> {
  const res = await t1Fetch<ChargeData>("/cargo", {
    monto: String(params.amount),
    descripcion: params.description,
    metodo_pago: "tarjeta",
    tarjeta: {
      token: params.token,
    },
    pedido: {
      id_externo: params.orderId,
      device_fingerprint: params.deviceFingerprint,
    },
  });

  return {
    id: res.data.cargo.id,
    status: res.data.cargo.estatus,
  };
}
