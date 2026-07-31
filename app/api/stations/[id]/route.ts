import { NextRequest } from "next/server";
import { updateStationPhone } from "@/lib/firebase";
import { successResponse, errorResponse } from "@/lib/responses";

/**
 * PATCH /api/stations/:id
 *
 * Called by the dashboard when the global technician phone number is saved
 * in Configuration → Notifications.  Updates phone + alerts on every station
 * document whose ID matches (called once per registered site).
 *
 * Request body:
 * {
 *   "phone":  "263771234567",
 *   "alerts": true
 * }
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const stationId = id?.trim();  // preserve casing — must match RTDB site ID exactly
  if (!stationId) {
    return errorResponse("Station ID is required in the URL.", 400);
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return errorResponse("Invalid JSON body.", 400);
  }

  const { phone, alerts } = (body ?? {}) as Record<string, unknown>;

  if (!phone || typeof phone !== "string" || !phone.trim()) {
    return errorResponse("phone is required.", 422);
  }

  try {
    await updateStationPhone(stationId, phone.trim(), alerts !== false);
    return successResponse(`Station "${stationId}" phone updated.`, 200);
  } catch (err) {
    console.error(`[PATCH /api/stations/${stationId}] Firestore update failed:`, err);
    // 404-ish: Firestore update() throws if the document doesn't exist
    return errorResponse(`Station "${stationId}" not found or update failed.`, 500);
  }
}
