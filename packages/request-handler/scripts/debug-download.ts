
import dotenv from "dotenv";
dotenv.config();
import { s3Service } from "../src/services/s3.service";
import path from "path";

const deploymentId = "674980d8-1af1-4539-b912-7b8dd82e90c9";
const outputDir = path.join("/tmp/deployments", deploymentId);

async function main() {
    console.log("Starting download test...");
    try {
        await s3Service.downloadDeployment(deploymentId, outputDir);
        console.log("Download success!");
    } catch (error) {
        console.error("Download failed:", error);
    }
}

main();
