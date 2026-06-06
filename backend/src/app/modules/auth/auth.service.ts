import bcryptjs from "bcryptjs";
import { StatusCodes } from "http-status-codes";
import { Secret } from "jsonwebtoken";
import moment from "moment";
import config from "../../config";
import AppError from "../../errors/AppError";
import { createToken, verifyToken } from "../../helpers/jwtHelper";
import { sendMail } from "../../helpers/sendMail";

import { TTokenUser } from "../../types/common";
import { Role } from "../../../generated/prisma/enums";
import prisma from "../../lib/prisma";

// ─────────────────────────────────────────────
// SIGN UP
// ─────────────────────────────────────────────

const signUpIntoDb = async (payload: {
  name: string;
  email: string;
  password: string;
  role?: Role;
}) => {
  // 1. Check duplicate email
  const isUserExist = await prisma.user.findFirst({
    where: { email: payload.email, validation: { isVerified: true } },
  });

  if (isUserExist) {
    throw new AppError(StatusCodes.BAD_REQUEST, "User already exists with this email");
  }

  // 2. Password is required
  if (!payload.password) {
    throw new AppError(StatusCodes.BAD_REQUEST, "Password is required");
  }

  const result = await prisma.$transaction(async (tx) => {
    // 3. Hash password
    const hashedPassword = await bcryptjs.hash(payload.password, Number(config.bcrypt_salt_rounds));

    // 4. Create user
    const user = await tx.user.upsert({
      where: {
        email: payload.email,
        validation: {
          isVerified: false,
        },
      },
      create: {
        name: payload.name,
        email: payload.email,
        passwordHash: hashedPassword,
        role: payload.role ?? Role.TEAM_MEMBER,
        isActive: true,
      },
      update: {
        name: payload.name,
        email: payload.email,
        passwordHash: hashedPassword,
        role: payload.role ?? Role.TEAM_MEMBER,
      },
    });

    // 5. Generate OTP for email verification
    const otp = Math.floor(100000 + Math.random() * 900000);
    const expiresAt = moment().add(5, "minute").toDate();

    // 6. Create validation record
    await tx.validation.upsert({
      where: { userId: user.id },
      update: { otp, isVerified: false, expiresAt },
      create: {
        otp,
        isVerified: false,
        expiresAt,
        userId: user.id,
      },
    });

    // 7. Generate verify-account token
    const jwtPayload = { email: user.email, role: user.role, id: user.id };
    const token = createToken(
      jwtPayload,
      config.jwt.tempUserTokenSecret as Secret,
      config.jwt.tempUserTokenExpires as string,
    );

    // 8. Send verification email
    await sendMail({
      to: user.email,
      subject: "Verify your account",
      html: `<p>Hi ${user.name},</p><p>Your OTP is <strong>${otp}</strong>. It expires in 5 minutes.</p>`,
    });

    return { token };
  });

  return result;
};

// ─────────────────────────────────────────────
// VERIFY ACCOUNT
// ─────────────────────────────────────────────

const verifyAccount = async (token: string, payload: { otp: number }) => {
  if (!token) {
    throw new AppError(StatusCodes.BAD_REQUEST, "Please provide your token");
  }

  const decode = verifyToken(token, config.jwt.tempUserTokenSecret as Secret) as TTokenUser;
  if (!decode) {
    throw new AppError(StatusCodes.BAD_REQUEST, "Invalid token");
  }

  const userData = await prisma.user.findUniqueOrThrow({
    where: { id: decode.id, email: decode.email },
    include: { validation: true },
  });

  if (!userData.isActive) {
    throw new AppError(StatusCodes.BAD_REQUEST, "Account is blocked");
  }

  if (userData.validation?.isVerified === true) {
    throw new AppError(StatusCodes.BAD_REQUEST, "Account is already verified");
  }

  // Check OTP expiry
  if (!userData.validation?.expiresAt || new Date() > userData.validation.expiresAt) {
    throw new AppError(StatusCodes.BAD_REQUEST, "OTP has expired. Please request a new one");
  }

  if (userData.validation?.otp !== payload.otp) {
    throw new AppError(StatusCodes.BAD_REQUEST, "Invalid OTP");
  }

  await prisma.$transaction(async (tx) => {
    await tx.validation.update({
      where: { userId: userData.id },
      data: { isVerified: true, otp: null, expiresAt: null },
    });

    await tx.user.update({
      where: { id: userData.id },
      data: { isActive: true },
    });
  });

  // Return access tokens after verification
  const jwtPayload = { email: userData.email, role: userData.role, id: userData.id };

  const accessToken = createToken(
    jwtPayload,
    config.jwt.jwtAccessTokenSecret as Secret,
    config.jwt.jwtAccessTokenExpires as string,
  );

  const refreshToken = createToken(
    jwtPayload,
    config.jwt.jwtRefreshTokenSecret as Secret,
    config.jwt.jwtRefreshTokenExpires as string,
  );

  return { accessToken, refreshToken, role: userData.role, id: userData.id };
};

// ─────────────────────────────────────────────
// RESEND OTP
// ─────────────────────────────────────────────

const resendOtp = async (user: TTokenUser) => {
  const userData = await prisma.user.findUniqueOrThrow({
    where: { id: user.id },
  });

  if (!userData.isActive) {
    throw new AppError(StatusCodes.BAD_REQUEST, "Account is blocked");
  }

  const otp = Math.floor(100000 + Math.random() * 900000);
  const expiresAt = moment().add(3, "minute").toDate();

  await prisma.validation.update({
    where: { userId: userData.id },
    data: { otp, expiresAt, isVerified: false },
  });

  await sendMail({
    to: userData.email,
    subject: "Your new OTP",
    html: `<p>Hi ${userData.name},</p><p>Your new OTP is <strong>${otp}</strong>. It expires in 3 minutes.</p>`,
  });

  // Return a fresh verify-account token
  const jwtPayload = { email: userData.email, role: userData.role, id: userData.id };
  const token = createToken(
    jwtPayload,
    config.jwt.tempUserTokenSecret as Secret,
    config.jwt.tempUserTokenExpires as string,
  );

  return { token };
};

// ─────────────────────────────────────────────
// SIGN IN
// ─────────────────────────────────────────────

const signInIntoDb = async (payload: { email: string; password: string }) => {
  const userData = await prisma.user.findFirst({
    where: { email: payload.email },
  });

  if (!userData) {
    throw new AppError(StatusCodes.NOT_FOUND, "No account found with this email");
  }

  if (!userData.isActive) {
    throw new AppError(StatusCodes.BAD_REQUEST, "Account is blocked");
  }

  // Check email verification
  const validation = await prisma.validation.findUnique({
    where: { userId: userData.id, isVerified: true },
  });

  if (!validation) {
    throw new AppError(
      StatusCodes.BAD_REQUEST,
      "Account is not verified. Please verify your email first",
    );
  }

  // Compare password
  const isMatch = await bcryptjs.compare(payload.password, userData.passwordHash);
  if (!isMatch) {
    throw new AppError(StatusCodes.BAD_REQUEST, "Invalid password");
  }

  const jwtPayload = { email: userData.email, role: userData.role, id: userData.id };

  const accessToken = createToken(
    jwtPayload,
    config.jwt.jwtAccessTokenSecret as Secret,
    config.jwt.jwtAccessTokenExpires as string,
  );

  const refreshToken = createToken(
    jwtPayload,
    config.jwt.jwtRefreshTokenSecret as Secret,
    config.jwt.jwtRefreshTokenExpires as string,
  );

  return { accessToken, refreshToken, role: userData.role, id: userData.id };
};

// ─────────────────────────────────────────────
// REFRESH TOKEN
// ─────────────────────────────────────────────

const refreshToken = async (token: string) => {
  const payload = verifyToken(token, config.jwt.jwtRefreshTokenSecret as Secret) as TTokenUser;

  const userData = await prisma.user.findUniqueOrThrow({
    where: { id: payload.id, email: payload.email },
  });

  if (!userData.isActive) {
    throw new AppError(StatusCodes.BAD_REQUEST, "Account is blocked");
  }

  const validation = await prisma.validation.findUnique({
    where: { userId: userData.id, isVerified: true },
  });

  if (!validation) {
    throw new AppError(StatusCodes.BAD_REQUEST, "Account is not verified");
  }

  const jwtPayload = { email: userData.email, role: userData.role, id: userData.id };

  const accessToken = createToken(
    jwtPayload,
    config.jwt.jwtAccessTokenSecret as Secret,
    config.jwt.jwtAccessTokenExpires as string,
  );

  return { accessToken, refreshToken: token, role: userData.role, id: userData.id };
};

// ─────────────────────────────────────────────
// CHANGE PASSWORD
// ─────────────────────────────────────────────

const changePassword = async (
  user: TTokenUser,
  payload: { oldPassword: string; newPassword: string },
) => {
  const userData = await prisma.user.findUniqueOrThrow({
    where: { id: user.id },
  });

  if (!userData.isActive) {
    throw new AppError(StatusCodes.BAD_REQUEST, "Account is blocked");
  }

  const validation = await prisma.validation.findUnique({
    where: { userId: userData.id, isVerified: true },
  });

  if (!validation) {
    throw new AppError(StatusCodes.BAD_REQUEST, "Account is not verified");
  }

  const isMatch = await bcryptjs.compare(payload.oldPassword, userData.passwordHash);
  if (!isMatch) {
    throw new AppError(StatusCodes.BAD_REQUEST, "Old password is incorrect");
  }

  const newHashedPassword = await bcryptjs.hash(
    payload.newPassword,
    Number(config.bcrypt_salt_rounds),
  );

  await prisma.user.update({
    where: { id: user.id },
    data: { passwordHash: newHashedPassword },
  });

  return null;
};

// ─────────────────────────────────────────────
// FORGOT PASSWORD — sends OTP via email
// ─────────────────────────────────────────────

const forgetPasswordIntoDb = async (payload: { email: string }) => {
  if (!payload.email) {
    throw new AppError(StatusCodes.BAD_REQUEST, "Email is required");
  }

  const userData = await prisma.user.findFirst({
    where: { email: payload.email },
  });

  if (!userData) {
    throw new AppError(StatusCodes.NOT_FOUND, "No account found with this email");
  }

  if (!userData.isActive) {
    throw new AppError(StatusCodes.BAD_REQUEST, "Account is blocked");
  }

  const otp = Math.floor(100000 + Math.random() * 900000);
  const expiresAt = moment().add(10, "minute").toDate();

  // Upsert so re-requesting doesn't fail
  await prisma.passwordResetOtp.upsert({
    where: { userId: userData.id },
    update: { otp, expiresAt, isUsed: false },
    create: { otp, expiresAt, isUsed: false, userId: userData.id },
  });

  await sendMail({
    to: userData.email,
    subject: "Reset your password",
    html: `<p>Hi ${userData.name},</p><p>Your password reset OTP is <strong>${otp}</strong>. It expires in 10 minutes.</p>`,
  });

  // Return a short-lived token to identify the user on reset
  const jwtPayload = { email: userData.email, role: userData.role, id: userData.id };
  const token = createToken(
    jwtPayload,
    config.jwt.forgetPasswordSecret as Secret,
    config.jwt.forgetPasswordExpires as string,
  );

  return { token };
};

// ─────────────────────────────────────────────
// RESET PASSWORD — verifies OTP then sets new password
// ─────────────────────────────────────────────

const resetPassword = async (token: string, payload: { otp: number; password: string }) => {
  const decode = verifyToken(token, config.jwt.forgetPasswordSecret as Secret) as TTokenUser;

  const userData = await prisma.user.findUniqueOrThrow({
    where: { id: decode.id, email: decode.email },
  });

  if (!userData.isActive) {
    throw new AppError(StatusCodes.BAD_REQUEST, "Account is blocked");
  }

  const resetRecord = await prisma.passwordResetOtp.findUnique({
    where: { userId: userData.id },
  });

  if (!resetRecord) {
    throw new AppError(
      StatusCodes.BAD_REQUEST,
      "No password reset request found. Please request a new one",
    );
  }

  if (resetRecord.isUsed) {
    throw new AppError(StatusCodes.BAD_REQUEST, "This OTP has already been used");
  }

  if (new Date() > resetRecord.expiresAt) {
    throw new AppError(StatusCodes.BAD_REQUEST, "OTP has expired. Please request a new one");
  }

  if (resetRecord.otp !== payload.otp) {
    throw new AppError(StatusCodes.BAD_REQUEST, "Invalid OTP");
  }

  const newHashedPassword = await bcryptjs.hash(
    payload.password,
    Number(config.bcrypt_salt_rounds),
  );

  await prisma.$transaction(async (tx) => {
    // Mark OTP as used
    await tx.passwordResetOtp.update({
      where: { userId: userData.id },
      data: { isUsed: true },
    });

    // Update password
    await tx.user.update({
      where: { id: userData.id },
      data: { passwordHash: newHashedPassword },
    });
  });

  const jwtPayload = { email: userData.email, role: userData.role, id: userData.id };

  const accessToken = createToken(
    jwtPayload,
    config.jwt.jwtAccessTokenSecret as Secret,
    config.jwt.jwtAccessTokenExpires as string,
  );

  const refreshToken = createToken(
    jwtPayload,
    config.jwt.jwtRefreshTokenSecret as Secret,
    config.jwt.jwtRefreshTokenExpires as string,
  );

  return { accessToken, refreshToken, role: userData.role, id: userData.id };
};

// ─────────────────────────────────────────────

const resendForgetPasswordOtp = async (token: string) => {
  const decode = verifyToken(token, config.jwt.forgetPasswordSecret as Secret) as TTokenUser;

  const userData = await prisma.user.findUniqueOrThrow({
    where: { id: decode.id, email: decode.email },
  });

  if (!userData.isActive) {
    throw new AppError(StatusCodes.BAD_REQUEST, "Account is blocked");
  }

  const otp = Math.floor(100000 + Math.random() * 900000);
  const expiresAt = moment().add(10, "minute").toDate();

  // Upsert — works whether or not a record already exists
  await prisma.passwordResetOtp.upsert({
    where: { userId: userData.id },
    update: { otp, expiresAt, isUsed: false },
    create: { otp, expiresAt, isUsed: false, userId: userData.id },
  });

  await sendMail({
    to: userData.email,
    subject: "Your new password reset OTP",
    html: `<p>Hi ${userData.name},</p><p>Your new password reset OTP is <strong>${otp}</strong>. It expires in 10 minutes.</p>`,
  });

  // Return a fresh token so the frontend can continue the reset flow
  const jwtPayload = { email: userData.email, role: userData.role, id: userData.id };
  const newToken = createToken(
    jwtPayload,
    config.jwt.forgetPasswordSecret as Secret,
    config.jwt.forgetPasswordExpires as string,
  );

  return { token: newToken };
};

export const AuthServices = {
  signUpIntoDb,
  verifyAccount,
  resendOtp,
  signInIntoDb,
  refreshToken,
  changePassword,
  forgetPasswordIntoDb,
  resetPassword,
  resendForgetPasswordOtp,
};
