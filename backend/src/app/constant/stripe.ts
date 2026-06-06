import Stripe from "stripe";
import config from "../config";

//export const stripe = new Stripe(config.payment.secretKey!, {
//  apiVersion: "2024-06-20",
//  typescript: true,
//});
export const stripe = new Stripe(config.payment.secretKey as string, {
  apiVersion: "2025-01-27.acacia",
  typescript: true,
});
