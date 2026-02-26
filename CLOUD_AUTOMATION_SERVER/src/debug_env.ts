import "dotenv/config";

const key = process.env.ENCRYPTION_KEY;
if (key) {
    console.log(`Key length: ${key.length}`);
    console.log(`Key hex: ${Buffer.from(key).toString('hex')}`);
    console.log(`Matches exact? ${key === "default-32-char-encryption-key!"}`);
} else {
    console.log("No key found.");
}
