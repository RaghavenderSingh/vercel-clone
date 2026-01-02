
import AWS from "aws-sdk";

const cloudfront = new AWS.CloudFront({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: process.env.AWS_REGION,
});

const distributionId = process.env.CLOUDFRONT_DISTRIBUTION_ID;

async function run() {
  if (!distributionId) {
    console.error("CLOUDFRONT_DISTRIBUTION_ID env var is missing");
    process.exit(1);
  }

  console.log(`Invalidating CloudFront Distribution: ${distributionId}`);

  try {
    const params = {
      DistributionId: distributionId,
      InvalidationBatch: {
        CallerReference: `invalidate-${Date.now()}`,
        Paths: {
          Quantity: 1,
          Items: ["/*"], // Invalidate everything
        },
      },
    };

    const result = await cloudfront.createInvalidation(params).promise();
    console.log("✅ Invalidation check created!");
    console.log(`Invalidation ID: ${result.Invalidation?.Id}`);
    console.log(`Status: ${result.Invalidation?.Status}`);
  } catch (error: any) {
    console.error("❌ Failed to create invalidation.");
    console.error(error.message);
  }
}

run();
