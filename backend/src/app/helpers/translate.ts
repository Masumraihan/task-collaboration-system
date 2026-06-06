import crypto from "crypto";
import axios from "axios";
import config from "../config";

// ---------------------------------------------------------------------------
// Alibaba Cloud Machine Translation
// Docs: https://www.alibabacloud.com/help/en/machine-translation
// ---------------------------------------------------------------------------

const ALI_MT_ENDPOINT = "https://mt.cn-hangzhou.aliyuncs.com/";
const ALI_MT_ACTION = "TranslateGeneral";
const ALI_MT_VERSION = "2018-10-12";

// ---------------------------------------------------------------------------
// Internal: build a signed request for Alibaba Cloud's REST API
// ---------------------------------------------------------------------------

function getTimestamp(): string {
  return new Date().toISOString().replace(/\.\d{3}Z$/, "Z");
}

function getNonce(): string {
  return crypto.randomBytes(8).toString("hex");
}

/**
 * Alibaba Cloud uses HMAC-SHA1 over a canonical query string.
 * See: https://www.alibabacloud.com/help/en/sdk/product-overview/rpc-mechanism
 */
function buildSignature(params: Record<string, string>, accessKeySecret: string): string {
  const sortedKeys = Object.keys(params).sort();

  const canonicalQuery = sortedKeys
    .map((k) => `${encodeURIComponent(k)}=${encodeURIComponent(params[k])}`)
    .join("&");

  const stringToSign = `POST&${encodeURIComponent("/")}&${encodeURIComponent(canonicalQuery)}`;
  const signingKey = `${accessKeySecret}&`;

  return crypto.createHmac("sha1", signingKey).update(stringToSign).digest("base64");
}

// ---------------------------------------------------------------------------
// Core translation call
// ---------------------------------------------------------------------------

async function callAliTranslate(
  text: string,
  sourceLang: string,
  targetLang: string,
): Promise<string> {
  const accessKeyId = config.aliAccessKeyId;
  const accessKeySecret = config.aliAccessKeySecret;

  if (!accessKeyId || !accessKeySecret) {
    throw new Error("Missing ALI_ACCESS_KEY_ID or ALI_ACCESS_KEY_SECRET in environment variables.");
  }

  const params: Record<string, string> = {
    Action: ALI_MT_ACTION,
    Version: ALI_MT_VERSION,
    AccessKeyId: accessKeyId,
    Timestamp: getTimestamp(),
    Format: "JSON",
    SignatureMethod: "HMAC-SHA1",
    SignatureVersion: "1.0",
    SignatureNonce: getNonce(),
    FormatType: "text",
    SourceLanguage: sourceLang,
    TargetLanguage: targetLang,
    SourceText: text,
    Scene: "general",
  };

  const signature = buildSignature(params, accessKeySecret);
  params.Signature = signature;

  const response = await axios.post(ALI_MT_ENDPOINT, new URLSearchParams(params).toString(), {
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    timeout: 10_000,
  });

  const body = response.data;

  // Alibaba Cloud returns a non-200 Code field on logical errors
  if (body.Code && body.Code !== "200") {
    throw new Error(`AliMT error [${body.Code}]: ${body.Message ?? "Unknown error"}`);
  }

  return body.Data?.Translated as string;
}

// ---------------------------------------------------------------------------
// Public API — identical signatures to your previous Google Translate helpers
// ---------------------------------------------------------------------------

/**
 * Translates a single string between English and Arabic.
 * Returns the original string unchanged if it is empty/whitespace.
 */
export const translateText = async (
  text: string,
  sourceLang: "en" | "ar",
  targetLang: "en" | "ar",
): Promise<string> => {
  if (!text?.trim()) return text;

  // Alibaba Cloud language codes for Arabic and English
  const langMap: Record<string, string> = {
    en: "en",
    ar: "ar",
  };

  return callAliTranslate(text, langMap[sourceLang], langMap[targetLang]);
};

// ---------------------------------------------------------------------------
// Bulk helper — same shape as before
// ---------------------------------------------------------------------------

export type LocalizableFields = {
  name: string;
  description: string;
  region: string;
  city: string;
  companyName?: string;
};

/**
 * Translates all localizable fields in parallel and returns a bilingual map.
 *
 * @example
 * const fields = await buildTranslatedFields({ name: "Hello", ... }, "en");
 * // { name: { en: "Hello", ar: "مرحبا" }, ... }
 */
export const buildTranslatedFields = async (
  fields: LocalizableFields,
  sourceLang: "en" | "ar",
): Promise<Record<keyof LocalizableFields, { en: string; ar: string }>> => {
  const targetLang = sourceLang === "en" ? "ar" : "en";

  const translateIfExists = (text?: string) =>
    text ? translateText(text, sourceLang, targetLang) : Promise.resolve("");

  const [
    nameTranslated,
    descriptionTranslated,
    regionTranslated,
    cityTranslated,
    companyNameTranslated,
  ] = await Promise.all([
    translateText(fields.name, sourceLang, targetLang),
    translateText(fields.description, sourceLang, targetLang),
    translateText(fields.region, sourceLang, targetLang),
    translateText(fields.city, sourceLang, targetLang),
    translateIfExists(fields.companyName),
  ]);

  const build = (original: string, translated: string) =>
    sourceLang === "en" ? { en: original, ar: translated } : { en: translated, ar: original };

  return {
    name: build(fields.name, nameTranslated),
    description: build(fields.description, descriptionTranslated),
    region: build(fields.region, regionTranslated),
    city: build(fields.city, cityTranslated),
    companyName: build(fields.companyName ?? "", companyNameTranslated),
  };
};

// ---------------------------------------------------------------------------
// Quick smoke-test (run with: npx ts-node translate.ts)
// ---------------------------------------------------------------------------

const test = async () => {
  try {
    const result = await translateText("Hello", "en", "ar");
    console.log("Translated:", result); // Expected: مرحبا
  } catch (error) {
    console.error("Translation error:", error);
  }
};

// test();
