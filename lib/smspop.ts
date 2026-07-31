import type { SmsPopResponse } from "@/types/sms";

/**
 * Sends a single SMS alert via the SMSPoP bulk-campaign endpoint.
 * Only this module needs to change if the SMS provider is ever swapped.
 */
export async function sendSms(phoneNumber: string, message: string): Promise<SmsPopResponse> {
  const token = process.env.SMSPOP_TOKEN;
  const senderId = process.env.SMSPOP_SENDER_ID;
  const baseUrl = process.env.SMSPOP_BASE_URL ?? "https://smspop.co.zw/api";

  if (!token || !senderId) {
    throw new Error("Missing SMSPoP environment variables (SMSPOP_TOKEN / SMSPOP_SENDER_ID).");
  }

  const payload = {
    name: `BTS Alert - ${new Date().toISOString()}`,
    message,
    sender_id: senderId,
    contact_import_method: "manual",
    manual_contacts: phoneNumber,
  };

  const response = await fetch(`${baseUrl}/campaigns`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify(payload),
  });

  const data = (await response.json()) as SmsPopResponse;
  return data;
}
