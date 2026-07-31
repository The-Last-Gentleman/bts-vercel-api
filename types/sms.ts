export interface IntrusionAlertRequest {
  stationId: string;
  deviceSecret?: string;
}

export interface StationConfig {
  name: string;
  loc: string;
  phone: string; // format: 263XXXXXXXXX
  alerts: boolean;
}

export interface SmsPopSuccessResponse {
  success: true;
  message: string;
  campaign: {
    name: string;
    message: string;
    sender_id: string;
    status: string;
  };
  summary: {
    sent: number;
    failed: number;
  };
  contacts: Array<{
    phone_number: string;
    status: string;
  }>;
}

export interface SmsPopErrorResponse {
  success: false;
  message: string;
  errors?: Record<string, string[]>;
}

export type SmsPopResponse = SmsPopSuccessResponse | SmsPopErrorResponse;

export interface ApiResult {
  success: boolean;
  message: string;
}

// ─── Firestore station document ───────────────────────────────────────────────
// Written by the dashboard when a site is registered or a phone number changes.
// Read by POST /api/sms when an intrusion alert fires.
export interface StationRecord {
  name: string;    // display name, e.g. "Harare CBD Tower"
  loc: string;     // region / location string, e.g. "Harare Central"
  phone: string;   // global technician number, format: 263XXXXXXXXX
  alerts: boolean; // whether SMS alerts are enabled for this station
}
