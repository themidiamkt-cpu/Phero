export const PAYMENT_WEBHOOK_URL =
  process.env.N8N_PAYMENT_WEBHOOK_URL ??
  process.env.N8N_WEBHOOK_URL ??
  "https://automacao2.themidiamarketing.com.br/webhook/personal-assinatura";

export type PaymentReceiptWebhookPayload = {
  event: "payment_receipt_uploaded";
  payment_id: string;
  receipt_id: string;
  student_id: string;
  trainer_id: string;
  student_name: string;
  trainer_name: string;
  expected_amount: number;
  due_date: string;
  file_url: string;
  file_type: string;
  uploaded_at: string;
};

export async function postWithRetry(url: string, payload: unknown, attempts = 3) {
  let lastError: unknown;

  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    try {
      const response = await fetch(url, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        return { ok: true, status: response.status, attempt };
      }

      lastError = new Error(`Webhook returned ${response.status}`);
    } catch (error) {
      lastError = error;
    }

    if (attempt < attempts) {
      await new Promise((resolve) => setTimeout(resolve, 350 * attempt));
    }
  }

  return {
    ok: false,
    status: 0,
    attempt: attempts,
    error: lastError instanceof Error ? lastError.message : "Unknown webhook error",
  };
}
