import crypto from "crypto";

// This AES key should match the one in the client script
const DEFAULT_AES_KEY = "EynDnmNF4fipxGmiErq0hMOC-lXBuBxgRhIAHQDM8XA";

export class CryptoUtils {
  private static aesKey: Buffer;

  static initialize(key: string = DEFAULT_AES_KEY) {
    // Generate a 32-byte key for AES-256 from the provided key
    this.aesKey = crypto.createHash("sha256").update(key).digest();
  }

  static getAesKey(): Buffer {
    if (!this.aesKey) {
      this.initialize();
    }
    return this.aesKey;
  }

  static encrypt(data: string | Buffer): string {
    try {
      if (typeof data === "string") {
        data = Buffer.from(data);
      }
      
      const iv = crypto.randomBytes(16);
      const cipher = crypto.createCipheriv("aes-256-cbc", this.getAesKey(), iv);
      
      const encrypted = Buffer.concat([iv, cipher.update(data), cipher.final()]);
      return encrypted.toString("base64");
    } catch (error) {
      console.error("Encryption error:", error);
      throw new Error("Failed to encrypt data");
    }
  }

  static decrypt(encryptedData: string | Buffer): string {
    try {
      if (typeof encryptedData === "string") {
        encryptedData = Buffer.from(encryptedData, "base64");
      }
      
      const iv = encryptedData.subarray(0, 16);
      const encryptedContent = encryptedData.subarray(16);
      
      const decipher = crypto.createDecipheriv("aes-256-cbc", this.getAesKey(), iv);
      
      const decrypted = Buffer.concat([
        decipher.update(encryptedContent),
        decipher.final()
      ]);
      
      return decrypted.toString();
    } catch (error) {
      console.error("Decryption error:", error);
      throw new Error("Failed to decrypt data");
    }
  }

  static generateClientId(): string {
    return crypto.randomUUID();
  }
}

// Initialize with the default key
CryptoUtils.initialize();
