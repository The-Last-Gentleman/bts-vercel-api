import { NextRequest } from "next/server";
import { upsertStation } from "@/lib/firebase";
import { successResponse, errorResponse } from "@/lib/responses";
import type { StationRecord } from "@/types/sms";

/**
 * POST /api/stations
 *
 * Called by the dashboard when a new BTS site is registered.
 * Creates (or replaces) the matching station document in Firestore so the
 * ESP32 intrusion-alert endpoint (POST /api/sms) can look it up immediately.
 *
 * Request body:
 * {
 *   "stationId": "BTS-001",
 *   "name":      "Harare CBD Tower",
 *   "loc":       "Harare Central",
 *   "phone":     "263771234567",   // global technician number
 *   "alerts":    true
 * }
 */
export async function POST(request: NextRequest) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return errorResponse("Invalid JSON body.", 400);
  }

  const { stationId, name, loc, phone, alerts } = (body ?? {}) as Record<string, unknown>;

  if (!stationId || typeof stationId !== "string" || !stationId.trim()) {
    return errorResponse("stationId is required.", 422);
  }
  if (!name || typeof name !== "string" || !name.trim()) {
    return errorResponse("name is required.", 422);
  }
  if (!loc || typeof loc !== "string" || !loc.trim()) {
    return errorResponse("loc is required.", 422);
  }
  if (!phone || typeof phone !== "string" || !phone.trim()) {
    return errorResponse("phone is required.", 422);
  }

  const record: StationRecord = {
    name:   name.trim(),
    loc:    loc.trim(),
    phone:  phone.trim(),
    alerts: alerts === true || alerts === undefined, // default to enabled
  };

  try {
    await upsertStation(stationId.trim(), record);  // preserve casing — must match RTDB site ID exactly
    return successResponse(`Station "${stationId}" registered in Firestore.`, 201);
  } catch (err) {
    console.error("[POST /api/stations] Firestore write failed:", err);
    return errorResponse("Failed to write station to Firestore.", 500);
  }
}
