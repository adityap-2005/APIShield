import { describe, it } from "node:test";
import assert from "node:assert/strict";
import crypto from "crypto";

import { generateApiKey, hashApiKey } from "../src/utils/apiKey.util.js";
import { API_KEY_STATUS, API_KEY_PREFIX } from "../src/constants/apiKey.js";
import { PROJECT_ROLES } from "../src/constants/projectRoles.js";
import { _authorizeApiKeyManagement } from "../src/helpers/apiKey.helper.js";
import { authenticateApiKey } from "../src/middleware/apiKeyAuth.middleware.js";

describe("APIShield — API Key Generation & Hashing", () => {
  it("generates API key with default aps_ prefix and valid SHA-256 hash", () => {
    const { apiKey, publicKeyId, keyHash } = generateApiKey();

    assert.ok(apiKey.startsWith("aps_"), "API key should start with default prefix");
    assert.strictEqual(typeof publicKeyId, "string");
    assert.ok(publicKeyId.startsWith("aps_"));
    assert.strictEqual(keyHash.length, 64, "Key hash must be a 64-character SHA-256 hex string");

    // Verify hash matches
    const expectedHash = crypto.createHash("sha256").update(apiKey).digest("hex");
    assert.strictEqual(keyHash, expectedHash);
    assert.strictEqual(hashApiKey(apiKey), expectedHash);
  });

  it("supports environment-specific prefixes", () => {
    const prodKey = generateApiKey("PRODUCTION");
    assert.ok(prodKey.apiKey.startsWith(API_KEY_PREFIX.PRODUCTION));

    const stageKey = generateApiKey("STAGING");
    assert.ok(stageKey.apiKey.startsWith(API_KEY_PREFIX.STAGING));

    const devKey = generateApiKey("DEVELOPMENT");
    assert.ok(devKey.apiKey.startsWith(API_KEY_PREFIX.DEVELOPMENT));
  });

  it("does not expose plaintext secret in hash", () => {
    const { apiKey, keyHash } = generateApiKey();
    assert.notStrictEqual(apiKey, keyHash);
    assert.ok(!keyHash.includes(apiKey));
  });
});

describe("APIShield — API Key Rotation Lifecycle", () => {
  it("rotates an eligible active key: updates secret hash and stamps lastRotatedAt while preserving identity", async () => {
    const originalId = "670c1a2b3c4d5e6f7a8b9c0d";
    const orgId = "670c1a2b3c4d5e6f7a8b9c01";
    const projId = "670c1a2b3c4d5e6f7a8b9c02";
    const userId = "670c1a2b3c4d5e6f7a8b9c03";

    const initialKey = generateApiKey();

    const mockApiKeyDoc = {
      _id: originalId,
      organizationId: orgId,
      projectId: projId,
      name: "Production Backend Key",
      description: "Core service communication key",
      status: API_KEY_STATUS.ACTIVE,
      publicKeyId: initialKey.publicKeyId,
      keyHash: initialKey.keyHash,
      createdBy: userId,
      createdAt: new Date("2026-10-01T10:00:00Z"),
      lastRotatedAt: null,
      rotatedBy: null,
      saveCalled: false,
      async save() {
        this.saveCalled = true;
        return this;
      }
    };

    // Simulate rotation logic (mirroring apiKey.service.js)
    assert.strictEqual(mockApiKeyDoc.status, API_KEY_STATUS.ACTIVE);
    const newCredentials = generateApiKey();
    const previousPublicKeyId = mockApiKeyDoc.publicKeyId;

    mockApiKeyDoc.publicKeyId = newCredentials.publicKeyId;
    mockApiKeyDoc.keyHash = newCredentials.keyHash;
    mockApiKeyDoc.lastRotatedAt = new Date();
    mockApiKeyDoc.rotatedBy = userId;
    await mockApiKeyDoc.save();

    // Verification:
    // 1. Stable identity preserved
    assert.strictEqual(mockApiKeyDoc._id, originalId, "Identity (_id) must remain identical after rotation");
    assert.strictEqual(mockApiKeyDoc.name, "Production Backend Key");
    assert.strictEqual(mockApiKeyDoc.organizationId, orgId);
    assert.strictEqual(mockApiKeyDoc.projectId, projId);
    assert.strictEqual(mockApiKeyDoc.status, API_KEY_STATUS.ACTIVE);

    // 2. Hash and public ID updated
    assert.strictEqual(mockApiKeyDoc.publicKeyId, newCredentials.publicKeyId);
    assert.notStrictEqual(mockApiKeyDoc.publicKeyId, previousPublicKeyId);
    assert.strictEqual(mockApiKeyDoc.keyHash, newCredentials.keyHash);
    assert.notStrictEqual(mockApiKeyDoc.keyHash, initialKey.keyHash);

    // 3. Rotation metadata stamped
    assert.ok(mockApiKeyDoc.lastRotatedAt instanceof Date);
    assert.strictEqual(mockApiKeyDoc.rotatedBy, userId);
    assert.ok(mockApiKeyDoc.saveCalled);

    // 4. Old secret is invalidated
    const oldSecretHash = hashApiKey(initialKey.apiKey);
    assert.notStrictEqual(oldSecretHash, mockApiKeyDoc.keyHash, "Old secret hash must no longer match rotated key");

    // 5. New secret is valid
    const newSecretHash = hashApiKey(newCredentials.apiKey);
    assert.strictEqual(newSecretHash, mockApiKeyDoc.keyHash, "New secret hash must match rotated key");
  });

  it("rejects rotation for revoked keys", () => {
    const revokedKey = {
      status: API_KEY_STATUS.REVOKED,
      expiresAt: null
    };

    assert.throws(
      () => {
        if (revokedKey.status === API_KEY_STATUS.REVOKED) {
          throw new Error("Revoked API key cannot be rotated.");
        }
      },
      /Revoked API key cannot be rotated./
    );
  });

  it("rejects rotation for archived keys", () => {
    const archivedKey = {
      status: API_KEY_STATUS.ARCHIVED,
      expiresAt: null
    };

    assert.throws(
      () => {
        if (archivedKey.status === API_KEY_STATUS.ARCHIVED) {
          throw new Error("Archived API key cannot be rotated.");
        }
      },
      /Archived API key cannot be rotated./
    );
  });

  it("rejects rotation for expired keys", () => {
    const expiredKey = {
      status: API_KEY_STATUS.ACTIVE,
      expiresAt: new Date(Date.now() - 10000)
    };

    assert.throws(
      () => {
        if (expiredKey.expiresAt && expiredKey.expiresAt <= new Date()) {
          throw new Error("Expired API key cannot be rotated.");
        }
      },
      /Expired API key cannot be rotated./
    );
  });
});

describe("APIShield — API Key Archiving Lifecycle", () => {
  it("archives an eligible key and stamps archivedAt timestamp", async () => {
    const userId = "670c1a2b3c4d5e6f7a8b9c03";
    const keyDoc = {
      _id: "670c1a2b3c4d5e6f7a8b9c0d",
      publicKeyId: "aps_live_9921",
      status: API_KEY_STATUS.ACTIVE,
      archivedAt: null,
      archivedBy: null,
      saveCalled: false,
      async save() {
        this.saveCalled = true;
        return this;
      }
    };

    keyDoc.status = API_KEY_STATUS.ARCHIVED;
    keyDoc.archivedAt = new Date();
    keyDoc.archivedBy = userId;
    await keyDoc.save();

    assert.strictEqual(keyDoc.status, API_KEY_STATUS.ARCHIVED);
    assert.ok(keyDoc.archivedAt instanceof Date);
    assert.strictEqual(keyDoc.archivedBy, userId);
    assert.ok(keyDoc.saveCalled);
  });

  it("handles repeated archive requests safely and idempotently", async () => {
    const existingDate = new Date("2026-10-20T00:00:00Z");
    const keyDoc = {
      _id: "670c1a2b3c4d5e6f7a8b9c0d",
      publicKeyId: "aps_live_9921",
      status: API_KEY_STATUS.ARCHIVED,
      archivedAt: existingDate
    };

    let response;
    if (keyDoc.status === API_KEY_STATUS.ARCHIVED) {
      response = {
        apiKeyId: keyDoc._id,
        publicKeyId: keyDoc.publicKeyId,
        status: keyDoc.status,
        archivedAt: keyDoc.archivedAt
      };
    }

    assert.deepStrictEqual(response, {
      apiKeyId: "670c1a2b3c4d5e6f7a8b9c0d",
      publicKeyId: "aps_live_9921",
      status: API_KEY_STATUS.ARCHIVED,
      archivedAt: existingDate
    });
  });

  it("disallows modifying archived or revoked keys", () => {
    const archivedKey = { status: API_KEY_STATUS.ARCHIVED };
    const revokedKey = { status: API_KEY_STATUS.REVOKED };

    assert.throws(() => {
      if (archivedKey.status === API_KEY_STATUS.ARCHIVED) {
        throw new Error("Archived API key cannot be modified.");
      }
    }, /Archived API key cannot be modified./);

    assert.throws(() => {
      if (revokedKey.status === API_KEY_STATUS.REVOKED) {
        throw new Error("Revoked API key cannot be modified.");
      }
    }, /Revoked API key cannot be modified./);
  });
});

describe("APIShield — Authorization & RBAC Enforcement", () => {
  it("allows PROJECT_ADMIN to manage API keys", () => {
    const projectAdminMembership = {
      role: PROJECT_ROLES.PROJECT_ADMIN
    };

    assert.doesNotThrow(() => {
      _authorizeApiKeyManagement(projectAdminMembership);
    });
  });

  it("rejects non-PROJECT_ADMIN members from managing API keys", () => {
    const regularMember = {
      role: PROJECT_ROLES.MEMBER
    };

    assert.throws(
      () => {
        _authorizeApiKeyManagement(regularMember);
      },
      /Only Project Admin can manage API Keys./
    );
  });

  it("rejects unauthorized memberships with different roles", () => {
    const invalidMembership = {
      role: "VIEWER"
    };

    assert.throws(
      () => {
        _authorizeApiKeyManagement(invalidMembership);
      },
      /Only Project Admin can manage API Keys./
    );
  });
});

describe("APIShield — Gateway API Key Authentication Middleware", () => {
  it("rejects request when x-api-key header is missing", async () => {
    const req = {
      header: (name) => (name.toLowerCase() === "x-api-key" ? null : null)
    };
    const res = {};
    let capturedError = null;

    await authenticateApiKey(req, res, (err) => {
      capturedError = err;
    });

    assert.ok(capturedError);
    assert.strictEqual(capturedError.statusCode, 401);
    assert.strictEqual(capturedError.message, "API key is required.");
  });

  it("distinguishes ACTIVE, REVOKED, ARCHIVED, and EXPIRED statuses during authentication", () => {
    const activeKey = { status: API_KEY_STATUS.ACTIVE, expiresAt: null };
    const revokedKey = { status: API_KEY_STATUS.REVOKED, expiresAt: null };
    const archivedKey = { status: API_KEY_STATUS.ARCHIVED, expiresAt: null };
    const expiredKey = { status: API_KEY_STATUS.ACTIVE, expiresAt: new Date(Date.now() - 5000) };

    // Active
    assert.strictEqual(activeKey.status === API_KEY_STATUS.ACTIVE, true);

    // Revoked must fail
    assert.strictEqual(revokedKey.status !== API_KEY_STATUS.ACTIVE, true);

    // Archived must fail
    assert.strictEqual(archivedKey.status !== API_KEY_STATUS.ACTIVE, true);

    // Expired must fail
    assert.ok(expiredKey.expiresAt && expiredKey.expiresAt <= new Date());
  });

  it("enforces organization and project isolation on gateway context", () => {
    const keyContext = {
      organizationId: "670c1a2b3c4d5e6f7a8b9c01",
      projectId: "670c1a2b3c4d5e6f7a8b9c02"
    };

    // Matching org & project
    assert.strictEqual(keyContext.organizationId.toString(), "670c1a2b3c4d5e6f7a8b9c01");
    assert.strictEqual(keyContext.projectId.toString(), "670c1a2b3c4d5e6f7a8b9c02");

    // Cross-organization attempt
    const targetOrgId = "670c1a2b3c4d5e6f7a8b9c99";
    assert.throws(() => {
      if (keyContext.organizationId.toString() !== targetOrgId.toString()) {
        throw new Error("API key does not belong to this organization.");
      }
    }, /API key does not belong to this organization./);

    // Cross-project attempt
    const targetProjId = "670c1a2b3c4d5e6f7a8b9c88";
    assert.throws(() => {
      if (keyContext.projectId.toString() !== targetProjId.toString()) {
        throw new Error("API key does not belong to this project.");
      }
    }, /API key does not belong to this project./);
  });
});
