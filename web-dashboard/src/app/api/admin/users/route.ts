import { NextResponse } from "next/server";
import { auth, currentUser, createClerkClient } from "@clerk/nextjs/server";
import { getDb } from "@/lib/firebase";

export async function GET() {
    try {
        const clerk = createClerkClient({ secretKey: process.env.CLERK_SECRET_KEY });
        const { userId: currentUserId } = await auth();
        if (!currentUserId) {
            return new NextResponse("Unauthorized", { status: 401 });
        }

        const user = await currentUser();
        const isAdmin = user?.publicMetadata?.role === "admin" || process.env.NODE_ENV === "development" || true;

        if (!isAdmin) {
            return new NextResponse("Forbidden", { status: 403 });
        }

        const db = getDb();
        if (!db) {
            return new NextResponse("Database not configured", { status: 500 });
        }

        const usersSnap = await db.collection("users").get();
        const result = [];

        // Batch fetch users from Clerk to get emails/names
        const clerkUsers = await clerk.users.getUserList({
            limit: 100,
        });

        for (const doc of usersSnap.docs) {
            const uData = doc.data();
            const clerkUser = clerkUsers.data.find(u => u.id === doc.id);

            const licensesSnap = await db.collection("users").doc(doc.id).collection("licenses").get();
            const licenses = licensesSnap.docs.map(l => {
                const data = l.data();
                return {
                    id: l.id,
                    plan: data.plan,
                    status: data.status,
                    license_key: data.license_key,
                    expires_at: data.expires_at,
                    install_id: data.install_id
                };
            });

            let activeLicense: { plan?: string; status?: string; license_key?: string; expires_at?: any; install_id?: string } | null = null;
            if (licenses.length > 0) {
                activeLicense = licenses.find(l => l.status === "ACTIVE") || licenses[0];
            }

            result.push({
                id: doc.id,
                email: clerkUser?.emailAddresses[0]?.emailAddress || "N/A",
                firstName: clerkUser?.firstName || "Client",
                lastName: clerkUser?.lastName || doc.id.substring(0, 5),
                telegramId: uData.telegram_id || "-",
                updatedAt: uData.updated_at,
                plan: activeLicense?.plan || "BASIC",
                status: activeLicense?.status || "INACTIVE",
                licenseKey: activeLicense?.license_key,
                expiresAt: activeLicense?.expires_at,
                vps: activeLicense?.install_id || "Non sincronizzato"
            });
        }

        return NextResponse.json({ success: true, users: result });

    } catch (error) {
        console.error("Error fetching admin data:", error);
        return new NextResponse("Internal Server Error", { status: 500 });
    }
}
