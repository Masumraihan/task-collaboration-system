// utils/sendSmsMsegat.ts
import axios from "axios";
import { StatusCodes } from "http-status-codes";
import AppError from "../errors/AppError";
import logger from "../lib/logger";
import config from "../config";

const MSEGAT_URL = "https://www.msegat.com/gw/sendsms.php";

/**
 * Sends an SMS (e.g. OTP) via Msegat API
 * @param phone - Phone number (e.g. "966501234567" or "05xxxxxxxx" or "+966501234567")
 * @param message - The text message (include OTP inside)
 * @returns Promise with response data or throws on error
 */
export async function sendSmsMsegat(
  phone: string,
  message: string,
): Promise<{ success: boolean; messageId?: string; error?: string }> {
  try {
    // Clean phone number (remove spaces, dashes, plus signs)
    const cleanedPhone = phone.replace(/[\s\-\+]/g, "");

    const payload = {
      userName: "Andak",
      apiKey: "0218239DEA9F4B35076651D4B1DE9219",
      userSender: "ENDAK",
      numbers: cleanedPhone,
      msg: message,
    };

    const response = await axios.post(MSEGAT_URL, payload, {
      headers: {
        "Content-Type": "application/json",
      },
      timeout: 15000, // 15 seconds timeout
    });

    const data = response.data;

    logger.info("Msegat raw response:", data);

    // Msegat success: plain text response
    if (typeof data === "string" && data.includes("successfully")) {
      return { success: true, messageId: data };
    }

    // Msegat success: JSON response
    if (response.status === 200 && data?.message === "Success") {
      return { success: true, messageId: data?.messageId || data?.id };
    }

    // Any other response is treated as failure
    const errorDetail = typeof data === "object" ? JSON.stringify(data) : String(data);
    if (config.nodeEnv !== "production") {
      return {success:true,}
    }
    throw new AppError(StatusCodes.BAD_REQUEST, `Msegat error: ${errorDetail}`);
  } catch (error: any) {
    // If it's already our AppError, re-throw as-is
    if (error instanceof AppError) {
      throw error;
    }

    // Extract the most meaningful error message from axios error
    let errorMessage = "Unknown error";

    if (error.response?.data) {
      errorMessage =
        typeof error.response.data === "object"
          ? JSON.stringify(error.response.data)
          : String(error.response.data);
    } else if (error.message) {
      errorMessage = error.message;
    }

    logger.error("Msegat SMS failed:", {
      message: errorMessage,
      status: error.response?.status,
      data: error.response?.data,
    });

    throw new AppError(StatusCodes.BAD_REQUEST, `SMS sending failed: ${errorMessage}`);
  }
}
