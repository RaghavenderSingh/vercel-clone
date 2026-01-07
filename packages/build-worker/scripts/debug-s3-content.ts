
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

  console.log(`Listing files in bucket: ${bucketName}`);

  try {
    const data = await s3.listObjectsV2({
      Bucket: bucketName,
      MaxKeys: 50,
    }).promise();

    if (!data.Contents || data.Contents.length === 0) {
      console.log("Bucket is empty.");
      return;
    }

    console.log("Found files:");
    data.Contents.forEach((item) => {
      console.log(`- ${item.Key} (Size: ${item.Size})`);
    });

  } catch (error: any) {
    console.error("❌ Failed to list objects.");
    console.error(error.message);
  }
}

run();
