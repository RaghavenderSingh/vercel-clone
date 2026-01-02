
import AWS from "aws-sdk";

const s3 = new AWS.S3({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: process.env.AWS_REGION,
});

const bucketName = process.env.S3_BUCKET;

async function run() {
  if (!bucketName) {
    console.error("S3_BUCKET env var is missing");
    process.exit(1);
  }
  console.log(`Checking bucket: ${bucketName}`);
  console.log(`Region: ${process.env.AWS_REGION}`);

  // 1. Check if we can access the bucket (Test credentials)
  try {
    await s3.headBucket({ Bucket: bucketName }).promise();
    console.log("✅ Credentials work. Connected to bucket.");
  } catch (error: any) {
    console.error("❌ Failed to connect to bucket.");
    if (error.code === 'NotFound') {
        console.error(`Bucket "${bucketName}" does not exist.`);
    } else if (error.code === 'Forbidden') {
        console.error("Access Forbidden. Check credentials or permissions.");
    }
    console.error("Error details:", error.message);
    process.exit(1);
  }

  // 2. Apply Policy
  const policy = {
    Version: "2012-10-17",
    Statement: [
      {
        Sid: "PublicReadGetObject",
        Effect: "Allow",
        Principal: "*",
        Action: "s3:GetObject",
        Resource: `arn:aws:s3:::${bucketName}/*`,
      },
    ],
  };

  try {
    console.log("Applying public read bucket policy...");
    await s3.putBucketPolicy({
      Bucket: bucketName,
      Policy: JSON.stringify(policy),
    }).promise();
    console.log("✅ Successfully applied Bucket Policy!");
    console.log("The 'Access Denied' error should now be resolved for deployed sites.");
  } catch (error: any) {
    console.error("❌ Failed to apply bucket policy.");
    console.error(error.message);
  }
}

run();
