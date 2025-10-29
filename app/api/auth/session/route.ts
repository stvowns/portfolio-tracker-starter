import { auth } from "@/lib/auth";

export async function GET(request: Request) {
  try {
    const session = await auth.api.getSession({
      headers: request.headers
    });
    
    return Response.json({ session });
  } catch (error) {
    console.error("Session API error:", error);
    return Response.json({ session: null }, { status: 500 });
  }
}
