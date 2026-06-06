import { StatusCodes } from "http-status-codes";
import { UserServices } from "./user.service";
import catchAsync from "../../lib/catchAsync";
import sendResponse from "../../lib/sendResponse";
import AppError from "../../errors/AppError";
import pick from "../../lib/pick";
import { userFilterableFields } from "./user.constant";
import { PaginationOption } from "../../../constant/common";
import { CustomRequest } from "../../types/common";

const createUser = catchAsync(async (req, res) => {
  const result = await UserServices.createUser(req.body);
  sendResponse(res, {
    statusCode: StatusCodes.CREATED,
    success: true,
    message: "User created successfully",
    data: result,
  });
});

const getUsers = catchAsync(async (req, res) => {
  const query = pick(req.query, userFilterableFields);
  const option = pick(req.query, PaginationOption);
  const { data, meta } = await UserServices.getUsers(query, option);
  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "Users fetched successfully",
    meta,
    data,
  });
});

const getUser = catchAsync(async (req, res) => {
  const user = (req as CustomRequest).user;
  const result = await UserServices.getUser(req.params.id);
  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "User fetched successfully",
    data: result,
  });
});

const updateUser = catchAsync(async (req, res) => {
  const result = await UserServices.updateUser(req.params.id, req.body);
  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "User updated successfully",
    data: result,
  });
});

const deleteUser = catchAsync(async (req, res) => {
  const result = await UserServices.deleteUser(req.params.id);
  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "User deleted successfully",
    data: result,
  });
});

const getMyProfile = catchAsync(async (req, res) => {
  const result = await UserServices.getMyProfile((req as CustomRequest).user);
  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "Profile fetched successfully",
    data: result,
  });
});

const updateMyProfile = catchAsync(async (req, res) => {
  const result = await UserServices.updateMyProfile((req as any).user, req.body);
  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "User updated successfully",
    data: result,
  });
});

const deleteMyProfile = catchAsync(async (req, res) => {
  const result = await UserServices.deleteMyProfile((req as any).user);
  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "User deleted successfully",
    data: result,
  });
});

const markAsVerified = catchAsync(async (req, res) => {
  await UserServices.markAsVerified(req.params.id);

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "User marked as verified successfully",
    data: null,
  });
});

export const UserControllers = {
  createUser,
  getUsers,
  getUser,
  updateUser,
  deleteUser,
  getMyProfile,
  updateMyProfile,
  deleteMyProfile,
  markAsVerified,
};
