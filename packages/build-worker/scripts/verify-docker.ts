import Docker from "dockerode";
import fs from "fs/promises";
import path from "path";

const docker = new Docker({ socketPath: process.env.DOCKER_SOCKET || '/Users/raghavender/.docker/run/docker.sock' });

async function verify() {
  console.log("🔍 Checking Docker Connectivity...");
  
  try {
    const pong = await docker.ping();
    console.log("✅ Docker Daemon is responding:", pong);
  } catch (error) {
    console.error("❌ Failed to connect to Docker Daemon. Is Docker running?");
    console.error(error);
    process.exit(1);
  }

  console.log("\n🧪 functionality Test: Running 'echo hello' in node:20-alpine...");
  
  try {
    const images = await docker.listImages();
    const hasImage = images.some(img => img.RepoTags?.includes("node:20-alpine"));
    
    if (!hasImage) {
        console.log("⬇️ Pulling node:20-alpine (this might take a moment)...");
        await new Promise((resolve, reject) => {
            docker.pull("node:20-alpine", (err: any, stream: any) => {
                if (err) return reject(err);
                docker.modem.followProgress(stream, onFinished, onProgress);
                function onFinished(err: any, output: any) {
                    if (err) return reject(err);
                    resolve(output);
                }
                function onProgress(event: any) {
                }
            });
        });
        console.log("✅ Image pulled.");
    }

    const container = await docker.createContainer({
      Image: "node:20-alpine",
      Cmd: ["echo", "Hello from Project Titan!"],
      Tty: false,
    });

    await container.start();
    
    const stream = await container.logs({
        stdout: true,
        stderr: true, 
        follow: true
    });

    container.modem.demuxStream(stream, process.stdout, process.stderr);
    
    await container.wait();
    await container.remove();

    console.log("\n✨ Success! Docker Build System is ready to go.");
  } catch (error) {
    console.error("❌ Container Execution Failed:");
    console.error(error);
    process.exit(1);
  }
}

verify();
