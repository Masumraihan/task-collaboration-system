import { S3Client } from "@aws-sdk/client-s3";
import config from "../config";

export const s3Client = new S3Client({
  region: `${config.aws.region}`,
  apiVersion:"2022-08-22",
  credentials: {
    accessKeyId: `${config.aws.accessKeyId}`,
    secretAccessKey: `${config.aws.secretAccessKey}`,
  },
});
