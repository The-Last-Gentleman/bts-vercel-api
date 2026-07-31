import { NextRequest } from "next/server";
import { getStationConfig } from "@/lib/firebase";
import { sendSms } from "@/lib/smspop";
import { validateIntrusionAlert } from "@/lib/validation";
import { successResponse, errorResponse } from "@/lib/responses";
import type { IntrusionAlertRequest } from "@/types/sms";

/**
 * POST /api/sms
 *
 * Called by the ESP32 whenever an intrusion is detected.
 *
 * Request body:
 * {
 *   "stationId": "station001",
 *   "deviceSecret": "optional, only needed if DEVICE_SHARED_SECRET is set"
 * }
 *
 * Flow:
 * 1. Parse + validate the request.
 * 2. Look up station config (emergency number, name) in Firebase.
 * 3. Build the alert message.
 * 4. Send it via SMSPoP.
 * 5. Return a simplified success/failure response to the ESP32.
 */
export async function POST(request: NextRequest) {
  // Step 1: Parse the request body.
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return errorResponse("Invalid JSON body.", 400);
  }

  // Step 2: Validate shape.
  const shapeCheck = validateIntrusionAlert(body);
  if (!shapeCheck.valid) {
    return errorResponse(shapeCheck.error ?? "Invalid request.", 422);
  }

  const { stationId } = body as IntrusionAlertRequest;

  // Step 3: Read station configuration from Firebase.
  let station;
  try {
    station = await getStationConfig(stationId);
  } catch (err) {
    console.error("Firebase read failed:", err);
    return errorResponse("Could not read station configuration.", 500);
  }

  if (!station) {
    return errorResponse(`No configuration found for stationId "${stationId}".`, 404);
  }

  if (!station.alerts) {
    return successResponse("Alerts are disabled for this station. No SMS sent.", 200);
  }

  if (!station.phone) {
    return errorResponse("Station has no emergency phone number configured.", 422);
  }

  // Step 4: Construct the alert message.
  const message = `ALERT: Intrusion detected at ${station.name} (${station.loc}).`;

  // Step 5: Send the SMS via SMSPoP.
  try {
    const result = await sendSms(station.phone, message);

    if (!result.success) {
      console.error("SMSPoP rejected the message:", result.message);
      return errorResponse(`SMS could not be sent: ${result.message}`, 502);
    }

    return successResponse("SMS sent successfully.", 200);
  } catch (err) {
    console.error("SMSPoP request failed:", err);
    return errorResponse("SMS could not be sent due to a server error.", 500);
  }
}

/**
 * Reject any method other than POST with a clear message,
 * instead of falling through to a generic 405 with no body.
 */
export async function GET() {
  return errorResponse("Method not allowed. Use POST.", 405);
}
