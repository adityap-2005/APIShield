import "dotenv/config";
import { encrypt, decrypt } from "./utils/encryption.js";

const secret = "my-fake-api-key-123";

const encrypted = encrypt(secret);

console.log("Encrypted:", encrypted);

const decrypted = decrypt(
    encrypted.encryptedData,
    encrypted.iv,
    encrypted.authTag
);

console.log("Decrypted:", decrypted);