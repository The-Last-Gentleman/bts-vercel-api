import { cert, getApps, initializeApp, type App } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import type { StationConfig } from "@/types/sms";

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
