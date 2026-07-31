import { cert, getApps, initializeApp, type App } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import type { StationConfig, StationRecord } from "@/types/sms";

/**
 * Initialises Firebase Admin exactly once (Vercel can reuse warm
 * function instances, so we guard against re-initialising).
 */
function getFirebaseApp(): App {
  const existingApps = getApps();
  if (existingApps.length > 0) {
    return existingApps[0];
  }

  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n");

  if (!projectId || !clientEmail || !privateKey) {
    throw new Error("Missing Firebase Admin environment variables.");
  }

  return initializeApp({
    credential: cert({ projectId, clientEmail, privateKey }),
  });
}

/**
 * Creates or fully replaces a station document in Firestore.
 * Called by POST /api/stations when the dashboard registers a new site.
 * Uses set() (not merge) so the document is always in a known shape.
 */
export async function upsertStation(
  stationId: string,
  data: StationRecord
): Promise<void> {
  const app = getFirebaseApp();
  const db = getFirestore(app);
  await db.collection("stations").doc(stationId).set(data);
}

/**
 * Patches only the phone + alerts fields on an existing station document.
 * Called by PATCH /api/stations/[id] when the global technician number changes.
 * Uses update() so unrelated fields (name, loc) are preserved.
 */
export async function updateStationPhone(
  stationId: string,
  phone: string,
  alerts: boolean
): Promise<void> {
  const app = getFirebaseApp();
  const db = getFirestore(app);
  await db.collection("stations").doc(stationId).update({ phone, alerts });
}

/**
 * Reads a single station's configuration document from Firestore.
 * Expected collection: "stations", document ID = stationId.
 *
 * Example Firestore document shape:
 * {
 *   stationName: "BTS Station 001",
 *   location: "Bindura",
 *   emergencyPhoneNumber: "263771234567",
 *   alertsEnabled: true
 * }
 */
export async function getStationConfig(stationId: string): Promise<StationConfig | null> {
  const app = getFirebaseApp();
  const db = getFirestore(app);

  const docRef = db.collection("stations").doc(stationId);
  const snapshot = await docRef.get();

  if (!snapshot.exists) {
    return null;
  }

  return snapshot.data() as StationConfig;
}
