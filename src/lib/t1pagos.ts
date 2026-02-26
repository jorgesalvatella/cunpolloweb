const T1_BASE_URL = process.env.T1_PAGOS_BASE_URL || "https://api.sandbox.t1pagos.com/v2";
const T1_API_KEY = process.env.T1_PAGOS_API_KEY!;

type TokenizeCardParams = {
  number: string;
  expMonth: string;
  expYear: string;
  cvv: string;
  holderName: string;
};

type TokenizeResponse = {
  token: string;
  brand: string;
  last4: string;
};

type ChargeParams = {
  token: string;
  amount: number; // centavos MXN
  description: string;
  reference: string;
  customerName: string;
  customerPhone: string;
};

type ChargeResponse = {
  id: string;
  status: string;
  reference: string;
};

async function t1Fetch<T>(endpoint: string, body: Record<string, unknown>): Promise<T> {
  const res = await fetch(`${T1_BASE_URL}${endpoint}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-API-Key": T1_API_KEY,
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const error = await res.text();
    throw new Error(`T1 Pagos error (${res.status}): ${error}`);
  }

  return res.json();
}

export async function tokenizeCard(params: TokenizeCardParams): Promise<TokenizeResponse> {
  return t1Fetch<TokenizeResponse>("/tarjeta", {
    numero: params.number.replace(/\s/g, ""),
    mes_expiracion: params.expMonth,
    anio_expiracion: params.expYear,
    cvv: params.cvv,
    nombre_titular: params.holderName,
  });
}

export async function createCharge(params: ChargeParams): Promise<ChargeResponse> {
  return t1Fetch<ChargeResponse>("/cargo", {
    token: params.token,
    monto: params.amount,
    moneda: "MXN",
    descripcion: params.description,
    referencia: params.reference,
    cliente: {
      nombre: params.customerName,
      telefono: params.customerPhone,
    },
  });
}
