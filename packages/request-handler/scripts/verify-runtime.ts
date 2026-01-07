import { containerService } from "../src/services/container.service";
import fs from "fs";
import path from "path";

process.env.DOCKER_SOCKET_PATH = "/Users/raghavender/.docker/run/docker.sock";

async function verify() {
    console.log("🧪 Testing ContainerService...");

    const mockDeploymentId = "verify-" + Date.now();
    const mockPath = path.resolve("/tmp/titan-verify");
    
    if (!fs.existsSync(mockPath)) fs.mkdirSync(mockPath, { recursive: true });
    
    const serverJs = `
        const http = require('http');
        const server = http.createServer((req, res) => {
            res.writeHead(200);
            res.end('Hello from Titan Container!');
        });
        server.listen(3000, '0.0.0.0', () => {
            console.log('Server listening on 3000');
        });
    `;
    fs.writeFileSync(path.join(mockPath, "server.js"), serverJs);

    try {
        console.log("🚀 Requesting Container for standard Node app...");
        const port = await containerService.getPort(mockDeploymentId, null, mockPath);
        console.log(`✅ Container started on host port: ${port}`);
        
        console.log("requesting http://localhost:" + port);
        const res = await fetch(`http://localhost:${port}`);
        const text = await res.text();
        console.log("Response:", text);
        
        if (text === "Hello from Titan Container!") {
             console.log("✨ SUCCESS: Runtime is fully containerized!");
        } else {
             console.error("❌ Response did not match expected output.");
             process.exit(1);
        }

    } catch (e) {
        console.error("❌ Failed:", e);
        process.exit(1);
    }
}

verify();
