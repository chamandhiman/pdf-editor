import {
  encryptPDF,
  AlreadyEncryptedError,
  PasswordEncodingError,
  type EncryptPDFOptions,
} from "@pdfsmaller/pdf-encrypt";
import { PDFDocument } from "pdf-lib";

export interface ProtectPdfOptions {
  userPassword: string;
  ownerPassword?: string | undefined;
  algorithm?: "AES-256" | "RC4" | undefined;
  allowPrinting?: boolean | undefined;
  allowModifying?: boolean | undefined;
  allowCopying?: boolean | undefined;
  allowAnnotating?: boolean | undefined;
}

export interface PasswordStrength {
  score: number; // 0 to 4
  label: "Very Weak" | "Weak" | "Fair" | "Strong" | "Very Strong";
  color: string;
  hasMinLength: boolean;
  hasUppercase: boolean;
  hasLowercase: boolean;
  hasNumber: boolean;
  hasSymbol: boolean;
}

export function evaluatePasswordStrength(password: string): PasswordStrength {
  const hasMinLength = password.length >= 8;
  const hasUppercase = /[A-Z]/.test(password);
  const hasLowercase = /[a-z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  const hasSymbol = /[^A-Za-z0-9]/.test(password);

  let score = 0;
  if (password.length >= 6) score++;
  if (hasMinLength && (hasUppercase || hasLowercase)) score++;
  if (hasNumber && (hasUppercase || hasLowercase)) score++;
  if (hasSymbol && password.length >= 8) score++;
  if (password.length >= 12 && hasNumber && hasSymbol && hasUppercase && hasLowercase) score++;

  score = Math.min(4, Math.max(0, score));

  const labels: PasswordStrength["label"][] = [
    "Very Weak",
    "Weak",
    "Fair",
    "Strong",
    "Very Strong",
  ];
  const colors = [
    "bg-red-500",
    "bg-orange-500",
    "bg-amber-500",
    "bg-emerald-500",
    "bg-green-600",
  ];

  return {
    score,
    label: labels[score] ?? "Weak",
    color: colors[score] ?? "bg-red-500",
    hasMinLength,
    hasUppercase,
    hasLowercase,
    hasNumber,
    hasSymbol,
  };
}

/**
 * Checks if a PDF is already encrypted or password protected.
 */
export async function isPdfEncrypted(pdfBytes: Uint8Array): Promise<boolean> {
  try {
    await PDFDocument.load(pdfBytes, { ignoreEncryption: false });
    return false;
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    if (msg.toLowerCase().includes("encrypted") || msg.toLowerCase().includes("password")) {
      return true;
    }
    return false;
  }
}

/**
 * Encrypts a PDF with standard password protection using Web Crypto.
 */
export async function protectPdf(
  pdfBytes: Uint8Array,
  options: ProtectPdfOptions,
): Promise<Uint8Array> {
  if (!options.userPassword || options.userPassword.trim() === "") {
    throw new Error("Please enter a password to protect your PDF.");
  }

  try {
    const encryptOptions: EncryptPDFOptions = {
      ownerPassword: options.ownerPassword?.trim() ? options.ownerPassword.trim() : options.userPassword,
      algorithm: options.algorithm ?? "AES-256",
      allowPrinting: options.allowPrinting ?? true,
      allowModifying: options.allowModifying ?? false,
      allowCopying: options.allowCopying ?? true,
      allowAnnotating: options.allowAnnotating ?? false,
    };

    const encrypted = await encryptPDF(pdfBytes, options.userPassword, encryptOptions);
    return encrypted;
  } catch (err) {
    if (err instanceof AlreadyEncryptedError) {
      throw new Error("This PDF document is already encrypted or password protected.");
    }
    if (err instanceof PasswordEncodingError) {
      throw new Error("The password contains unsupported characters. Please use standard characters.");
    }
    throw err;
  }
}
