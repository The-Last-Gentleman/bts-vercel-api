import type { IntrusionAlertRequest } from "@/types/sms";

interface ValidationResult {
  valid: boolean;
  error?: string;
}

/**
 * Validates the incoming intrusion alert payload from the ESP32.
 * Keeps validation logic out of the route handler.
 */
export function validateIntrusionAlert(body: unknown): ValidationResult {
  if (typeof body !== "object" || body === null) {
    return { valid: false, error: "Request body must be a JSON object." };
  }

  const payload = body as Partial<IntrusionAlertRequest>;

  if (!payload.stationId || typeof payload.stationId !== "string") {
    return { valid: false, error: "stationId is required and must be a string." };
  }

  if (payload.stationId.trim().length === 0) {
    return { valid: false, error: "stationId cannot be empty." };
  }

  return { valid: true };
}

/**
 * Optional device-level check. If DEVICE_SHARED_SECRET is set in the
 * environment, incoming requests must include a matching deviceSecret.
 * This gives a lightweight layer of protection against random requests
 * hitting the public endpoint.
 */
export function validateDeviceSecret(body: unknown): ValidationResult {
  const expected = process.env.DEVICE_SHARED_SECRET;

  // If no secret is configured, skip this check (useful for early prototyping).
  if (!expected) {
    return { valid: true };
  }

  const payload = body as Partial<IntrusionAlertRequest>;

  if (payload.deviceSecret !== expected) {
    return { valid: false, error: "Unauthorized device." };
  }

  return { valid: true };
}
