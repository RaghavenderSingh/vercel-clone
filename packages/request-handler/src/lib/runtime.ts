
import { spawn, ChildProcess } from "child_process";
import path from "path";
import net from "net";

interface RuntimeInstance {
  process: ChildProcess;
  port: number;
  lastUsed: number;
}

class RuntimeManager {
  private instances = new Map<string, RuntimeInstance>();

  async getPort(
    deploymentId: string, 
    executePath: string, 
    startCommand: { cmd: string, args: string[] } = { cmd: "node", args: ["server.js"] }
  ): Promise<number> {
    const existing = this.instances.get(deploymentId);
    if (existing) {
      existing.lastUsed = Date.now();
      return existing.port;
    }

    const port = await this.findFreePort();
    
    console.log(`[Runtime] Starting ${deploymentId} on port ${port} with ${startCommand.cmd} ${startCommand.args.join(" ")}...`);
    
    
    const child = spawn(startCommand.cmd, startCommand.args, {
      env: { ...process.env, PORT: String(port), HOSTNAME: "0.0.0.0" },
      cwd: executePath,
      stdio: "inherit", 
    });

    child.on("error", (err) => {
      console.error(`[Runtime] Failed to start ${deploymentId}:`, err);
      this.instances.delete(deploymentId);
    });
    
    child.on("exit", (code) => {
        console.log(`[Runtime] ${deploymentId} exited with code ${code}`);
        this.instances.delete(deploymentId);
    });

    const instance: RuntimeInstance = {
      process: child,
      port,
      lastUsed: Date.now(),
    };

    this.instances.set(deploymentId, instance);

    await new Promise((resolve) => setTimeout(resolve, 2000));

    return port;
  }

  private findFreePort(): Promise<number> {
    return new Promise((resolve, reject) => {
      const server = net.createServer();
      server.unref();
      server.on("error", reject);
      server.listen(0, () => {
        const addr = server.address();
        const port = typeof addr === "string" ? 0 : addr?.port;
        server.close(() => {
          if (port) resolve(port);
          else reject(new Error("Could not find free port"));
        });
      });
    });
  }
}

export const runtimeManager = new RuntimeManager();
