import { JwtPayload } from "jsonwebtoken";
import { Request } from "express";
import { Role } from "../../generated/prisma/enums";

export type TTokenUser = {
  email?: string;
  role: Role;
  id: string;
  phoneNumber: string;
  username: string;
} & JwtPayload;

export interface CustomRequest extends Request {
  user: TTokenUser;
}

export type TLocalizedName = {
  en?: string;
  ar?: string;
};
