import "dotenv/config";

import connectDB from "../src/database/mongodb.js";

import Environment from "./models/environment.model.js";

import { decrypt } from "./utils/encryption.js";

await connectDB();

const environment =
    await Environment.findById(
        "6aa7865c865fd918e03e8f0b"
    ).select(
        "+encryptedCredential +encryptionIv +encryptionAuthTag"
    );

if (!environment) {
    throw new Error("Environment not found.");
}

const credential = decrypt(
    environment.encryptedCredential,
    environment.encryptionIv,
    environment.encryptionAuthTag
);

console.log(
    "Decrypted credential:",
    credential
);

process.exit(0);