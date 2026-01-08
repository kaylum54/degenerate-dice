import { NextRequest, NextResponse } from "next/server";
import { storage } from "@/lib/storage";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    // Verify admin password from query params
    const { searchParams } = new URL(request.url);
    const password = searchParams.get("password");
    const adminPassword = process.env.ADMIN_PASSWORD;

    if (!adminPassword || password !== adminPassword) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const limit = parseInt(searchParams.get("limit") || "20");
    const history = await storage.getRoundHistory(limit);

    return NextResponse.json({
      success: true,
      history,
      count: history.length,
    });
  } catch (error) {
    console.error("Error fetching round history:", error);
    return NextResponse.json(
      { error: "Failed to fetch round history" },
      { status: 500 }
    );
  }
}
