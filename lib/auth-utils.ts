import { auth } from "./auth";
import { headers } from "next/headers";
import { NextRequest } from "next/server";

// DEVELOPMENT MODE FLAG
const IS_DEV = process.env.NODE_ENV === 'development';

/**
 * Server side'da kullanmak için session helper'ı
 * API route'larda kullanıcı doğrulaması için kullanılır
 */
export async function getServerSession(request?: NextRequest) {
    if (IS_DEV) {
        // Development mode için mock session
        return {
            user: {
                id: "dev-user-id",
                email: "dev@example.com"
            }
        };
    }
    
    try {
        const session = await auth.api.getSession({
            headers: request ? request.headers : await headers()
        });

        return session;
    } catch (error) {
        console.error("Session alma hatası:", error);
        return null;
    }
}

/**
 * API route'larda kullanıcı kimlik doğrulaması yapar
 * Geliştirme modunda devre dışı, production modunda aktif
 */
export async function requireAuth(request: NextRequest) {
    if (IS_DEV) {
        // Development mode için mock user
        return {
            user: {
                id: "dev-user-id",
                email: "dev@example.com"
            }
        };
    }
    
    // Production authentication
    const session = await getServerSession(request);
    
    if (!session || !session.user) {
        return Response.json(
            { error: "Yetkilendirme gerekli. Lütfen giriş yapın." }, 
            { status: 401 }
        );
    }

    return session;
}

/**
 * Kullanıcının yalnızca kendi verilerine erişebilmesini sağlar
 */
export function ensureUserOwnership(sessionUserId: string, resourceUserId: string) {
    if (sessionUserId !== resourceUserId) {
        return Response.json(
            { error: "Bu kaynağa erişim izniniz yok." },
            { status: 403 }
        );
    }
    return null;
}