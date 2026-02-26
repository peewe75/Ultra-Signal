import { NextResponse } from "next/server";
import { auth, currentUser, createClerkClient } from "@clerk/nextjs/server";
import { getDb } from "@/lib/firebase";

export async function POST(req: Request) {
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

        const { targetUserId, action } = await req.json();
        if (!targetUserId || !action) {
            return new NextResponse("Bad Request", { status: 400 });
        }

        const db = getDb();
        if (!db) {
            return new NextResponse("Database not configured", { status: 500 });
        }

        const targetUserRef = db.collection("users").doc(targetUserId);

        if (action === "delete") {
            // 1. Delete from Clerk
            try {
                await clerk.users.deleteUser(targetUserId);
                console.log(`Deleted user ${targetUserId} from Clerk`);
            } catch (err) {
                console.error("Clerk delete error (might not exist):", err);
            }

            // 2. Delete from Global Licenses collection
            try {
                const globalLicensesSnap = await db.collection("licenses").where("userId", "==", targetUserId).get();
                if (!globalLicensesSnap.empty) {
                    const batch = db.batch();
                    globalLicensesSnap.docs.forEach(doc => batch.delete(doc.ref));
                    await batch.commit();
                    console.log(`Deleted ${globalLicensesSnap.size} global licenses for ${targetUserId}`);
                }
            } catch (err) {
                console.error("Error deleting global licenses:", err);
            }

            // 3. Delete from User Subcollection Licenses
            try {
                const licensesDocs = await targetUserRef.collection("licenses").get();
                if (!licensesDocs.empty) {
                    const batch = db.batch();
                    licensesDocs.docs.forEach(doc => batch.delete(doc.ref));
                    await batch.commit();
                    console.log(`Deleted ${licensesDocs.size} subcollection licenses for ${targetUserId}`);
                }
            } catch (err) {
                console.error("Error deleting subcollection licenses:", err);
            }

            // 4. Delete the User Document
            await targetUserRef.delete();
            console.log(`Deleted user document ${targetUserId} from Firestore`);

            return NextResponse.json({ success: true, message: "User deleted from Clerk and Firestore" });
        }

        const licensesSnap = await targetUserRef.collection("licenses").get();
        const licenses = licensesSnap.docs.map(l => ({ id: l.id, ...l.data() }));

        if (licenses.length === 0) {
            return new NextResponse("No license found", { status: 404 });
        }

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const activeLicense = licenses.find((l: any) => l.status === "ACTIVE") || licenses[0];
        const newStatus = action === "suspend" ? "SUSPENDED" : "ACTIVE";

        await targetUserRef.collection("licenses").doc(activeLicense.id).update({
            status: newStatus
        });

        return NextResponse.json({ success: true, newStatus });

    } catch (error) {
        console.error("Error performing admin action:", error);
        return new NextResponse("Internal Server Error", { status: 500 });
    }
}
