
import AWS from "aws-sdk";
import fs from "fs";
import path from "path";
import { promisify } from "util";

const writeFile = promisify(fs.writeFile);
const mkdir = promisify(fs.mkdir);

export class S3Service {
  private s3: AWS.S3;
  private bucket: string;

  constructor() {
    this.s3 = new AWS.S3({
      accessKeyId: process.env.AWS_ACCESS_KEY_ID,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
      region: process.env.AWS_REGION || "us-east-1",
    });
    this.bucket = process.env.S3_BUCKET || "vercel-clones";
  }

  async downloadDeployment(deploymentId: string, outputDir: string) {
    console.log(`Downloading deployment ${deploymentId} to ${outputDir}...`);
    const prefix = `deployments/${deploymentId}/`;

    let continuationToken: string | undefined;
    let allKeys: string[] = [];

    // 1. List all files (with pagination)
    do {
        const listParams: AWS.S3.ListObjectsV2Request = {
            Bucket: this.bucket,
            Prefix: prefix,
            ContinuationToken: continuationToken
        };

        const listedObjects = await this.s3.listObjectsV2(listParams).promise();
        
        if (listedObjects.Contents) {
            listedObjects.Contents.forEach((obj) => {
                if (obj.Key) allKeys.push(obj.Key);
            });
        }

        continuationToken = listedObjects.NextContinuationToken;

    } while (continuationToken);

    if (allKeys.length === 0) {
      throw new Error("Deployment not found in S3 (No files)");
    }
    
    console.log(`Found ${allKeys.length} files. Starting download...`);

    // 2. Download files in parallel (batches of 20)
    const BATCH_SIZE = 20;
    for (let i = 0; i < allKeys.length; i += BATCH_SIZE) {
        const batch = allKeys.slice(i, i + BATCH_SIZE);
        
        await Promise.all(batch.map(async (key) => {
             const relativePath = key.replace(prefix, ""); 
             if (!relativePath) return;

             const filePath = path.join(outputDir, relativePath);
             const dirName = path.dirname(filePath);

             await mkdir(dirName, { recursive: true });
             
             for (let attempt = 1; attempt <= 3; attempt++) {
                try {
                    const downloadPromise = this.s3.getObject({
                        Bucket: this.bucket,
                        Key: key
                    }).promise();

                    const timeoutPromise = new Promise((_, reject) => 
                        setTimeout(() => reject(new Error("Download timeout")), 10000)
                    );

                    const fileData = await Promise.race([downloadPromise, timeoutPromise]) as AWS.S3.GetObjectOutput;

                    if (fileData.Body) {
                        await writeFile(filePath, fileData.Body as Buffer);
                    }
                    break;
                } catch (e) {
                    if (attempt === 3) {
                        console.error(`Failed to download ${key} after 3 attempts:`, e);
                        throw e;
                    }
                    await new Promise(r => setTimeout(r, 1000 * attempt));
                }
             }
        }));
        if ((i + BATCH_SIZE) % 100 === 0) console.log(`Downloaded ${i + BATCH_SIZE}/${allKeys.length}...`);
    }

    await writeFile(path.join(outputDir, ".ready"), "");

    console.log(`Downloaded deployment ${deploymentId} successfully.`);
  }
}

export const s3Service = new S3Service();
