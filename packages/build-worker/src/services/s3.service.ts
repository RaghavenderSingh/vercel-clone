import AWS from "aws-sdk";
import fs from "fs/promises";
import path from "path";
import { glob } from "glob";
import { createLogger } from "@vercel-clone/shared";

const logger = createLogger('build-worker');

export class S3Service {
  private s3: AWS.S3;
  private bucket: string;

  constructor() {
    this.s3 = new AWS.S3({
      accessKeyId: process.env.AWS_ACCESS_KEY_ID,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
      region: process.env.AWS_REGION || "ap-south-1",
    });
    this.bucket = process.env.S3_BUCKET || "vercel-clone-builds";
  }

  async uploadDirectory(localPath: string, s3Prefix: string) {
    logger.info('Starting S3 upload', { localPath, s3Prefix, bucket: this.bucket });
    const files = await glob("**/*", {
      cwd: localPath,
      nodir: true,
      dot: true,
      follow: true,
    });

    logger.info('Files found for upload', { fileCount: files.length, s3Prefix });
    const uploadPromises = files.map(async (file) => {
      const filePath = path.join(localPath, file);
      const fileContent = await fs.readFile(filePath);
      const s3Key = `${s3Prefix}/${file}`;
      const contentType = this.getContentType(file);

      await this.s3
        .putObject({
          Bucket: this.bucket,
          Key: s3Key,
          Body: fileContent,
          ContentType: contentType,
        })
        .promise();

      logger.debug('File uploaded', { s3Key, contentType });
    });

    await Promise.all(uploadPromises);
    logger.info('S3 upload completed', { s3Prefix, fileCount: files.length });
  }

  async uploadFile(filePath: string, s3Key: string) {
    const fileContent = await fs.readFile(filePath);
    const contentType = this.getContentType(filePath);

    await this.s3
      .putObject({
        Bucket: this.bucket,
        Key: s3Key,
        Body: fileContent,
        ContentType: contentType,
      })
      .promise();
  }

  private getContentType(filename: string): string {
    const ext = path.extname(filename).toLowerCase();
    const contentTypes: Record<string, string> = {
      ".html": "text/html",
      ".css": "text/css",
      ".js": "application/javascript",
      ".json": "application/json",
      ".png": "image/png",
      ".jpg": "image/jpeg",
      ".jpeg": "image/jpeg",
      ".gif": "image/gif",
      ".svg": "image/svg+xml",
      ".webp": "image/webp",
      ".ico": "image/x-icon",
      ".woff": "font/woff",
      ".woff2": "font/woff2",
      ".ttf": "font/ttf",
      ".txt": "text/plain",
    };

    return contentTypes[ext] || "application/octet-stream";
  }

  async getFileUrl(s3Key: string): Promise<string> {
    return `https://${this.bucket}.s3.${process.env.AWS_REGION}.amazonaws.com/${s3Key}`;
  }
}

const s3Service = new S3Service();
export const uploadDirectory = (localPath: string, s3Prefix: string) =>
  s3Service.uploadDirectory(localPath, s3Prefix);
