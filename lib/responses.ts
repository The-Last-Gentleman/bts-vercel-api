import { NextResponse } from "next/server";
import type { ApiResult } from "@/types/sms";

/**
 * Standardised success response for all API routes.
 */
export function successResponse(message: string, status = 200): NextResponse<ApiResult> {
  return NextResponse.json({ success: true, message }, { status });
}

/**
 * Standardised error response for all API routes.
 */
export function errorResponse(message: string, status = 400): NextResponse<ApiResult> {
  return NextResponse.json({ success: false, message }, { status });
}
