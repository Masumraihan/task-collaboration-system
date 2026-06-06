import jwt, { JwtPayload, Secret } from "jsonwebtoken";
import { StatusCodes } from "http-status-codes";
import AppError from "../errors/AppError";

export const createToken = (
  jwtPayload: Record<string, unknown>,
  secret: Secret,
  expiresIn: string,
) => {
  try {
    return jwt.sign(jwtPayload, secret, { expiresIn: expiresIn as any });
  } catch (error) {
    return error;
  }
};

export const verifyToken = (token: string, secret: Secret) => {
  try {
    return jwt.verify(token, secret) as JwtPayload;
  } catch (error: any) {
    console.log(error);
    throw new AppError(StatusCodes.UNAUTHORIZED, error.message || "Invalid Token");
  }
};
