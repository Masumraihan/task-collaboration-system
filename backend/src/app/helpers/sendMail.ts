/* eslint-disable @typescript-eslint/ban-ts-comment */
import axios from "axios";
import config from "../config";
import AppError from "../errors/AppError";
import { StatusCodes } from "http-status-codes";
import nodemailer from "nodemailer";

type TAttachment = {
  filename: string;
  path: string;
  cid?: string;
  contentType?: string;
  content?: string;
};

type TEmail = {
  to: string;
  html: string;
  subject: string;
  from?: string;
  attachments?: TAttachment[];
};

export const sendMail = async ({ to, html, subject, from }: TEmail) => {
  try {
    //const mailResponseFromVercel = await axios.post(
    //  "https://email-server-teal.vercel.app/send-email",
    //  {
    //    to,
    //    html,
    //    subject,
    //    from,
    //    email: config.email.user,
    //    pass: config.email.pass,
    //  },
    //);

    //console.log(mailResponseFromVercel.data, "from send mail");

    const transporter = nodemailer.createTransport({
      //@ts-ignore
      host: "smtp.gmail.com",
      port: config.email.port,
      secure: false,
      auth: {
        user: config.email.user,
        pass: config.email.pass,
      },
    });

    // send mail with defined transport object
    await transporter.sendMail({
      from: from || config.email.user, // sender address
      to,
      replyTo: from || config.email.user,
      subject,
      html,
    });
  } catch (error) {
    console.log(error);
    //throw new AppError(StatusCodes.BAD_REQUEST, (error as Error).message || "Failed to send email");
  }
};
