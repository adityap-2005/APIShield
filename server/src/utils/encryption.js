import crypto from "crypto";

const ALGORITHM = "aes-256-gcm";

const getEncryptionKey = () => {
    const key = Buffer.from(
        process.env.ENCRYPTION_KEY,
        "hex"
    );

    if (key.length !== 32) {
        throw new Error(
            "ENCRYPTION_KEY must be a 32-byte hexadecimal key."
        );
    }

    return key;
};

export const encrypt = (text) => {
    const key = getEncryptionKey();

    const iv = crypto.randomBytes(12);

    const cipher = crypto.createCipheriv(
        ALGORITHM,
        key,
        iv
    );

    const encrypted = Buffer.concat([
        cipher.update(text, "utf8"),
        cipher.final()
    ]);

    const authTag = cipher.getAuthTag();

    return {
        encryptedData: encrypted.toString("hex"),
        iv: iv.toString("hex"),
        authTag: authTag.toString("hex")
    };
};

export const decrypt = (
    encryptedData,
    iv,
    authTag
) => {
    const key = getEncryptionKey();

    const decipher = crypto.createDecipheriv(
        ALGORITHM,
        key,
        Buffer.from(iv, "hex")
    );

    decipher.setAuthTag(
        Buffer.from(authTag, "hex")
    );

    const decrypted = Buffer.concat([
        decipher.update(
            Buffer.from(encryptedData, "hex")
        ),
        decipher.final()
    ]);

    return decrypted.toString("utf8");
};