import fs from "fs/promises";
import path from "path";

interface CacheEntry {
  deploymentId: string;
  path: string;
  size: number;
  lastAccess: number;
}

const MAX_CACHE_SIZE = 5 * 1024 * 1024 * 1024;
const CACHE_BASE_DIR = "/tmp/deployments";

export class DeploymentCache {
  private cache: Map<string, CacheEntry> = new Map();
  private totalSize: number = 0;

  /**
   * Mark a deployment as accessed (updates LRU)
   */
  async markAccessed(deploymentId: string): Promise<void> {
    const entry = this.cache.get(deploymentId);
    if (entry) {
      entry.lastAccess = Date.now();
    } else {
      const deploymentPath = path.join(CACHE_BASE_DIR, deploymentId);
      try {
        const size = await this.getDirectorySize(deploymentPath);
        this.cache.set(deploymentId, {
          deploymentId,
          path: deploymentPath,
          size,
          lastAccess: Date.now(),
        });
        this.totalSize += size;

        await this.evictIfNeeded();
      } catch (error) {
        console.error(`Failed to cache entry for ${deploymentId}:`, error);
      }
    }
  }

  /**
   * Evict least recently used deployments if cache exceeds max size
   */
  private async evictIfNeeded(): Promise<void> {
    if (this.totalSize <= MAX_CACHE_SIZE) {
      return;
    }

    console.log(`[Cache] Size exceeded: ${this.formatBytes(this.totalSize)}/${this.formatBytes(MAX_CACHE_SIZE)}`);
    console.log(`[Cache] Starting LRU eviction...`);

    const sorted = Array.from(this.cache.values()).sort(
      (a, b) => a.lastAccess - b.lastAccess
    );

    const evicted: string[] = [];

    for (const entry of sorted) {
      if (this.totalSize <= MAX_CACHE_SIZE * 0.8) {
        break;
      }

      try {
        await fs.rm(entry.path, { recursive: true, force: true });
        this.cache.delete(entry.deploymentId);
        this.totalSize -= entry.size;
        evicted.push(entry.deploymentId);
        console.log(
          `[Cache] Evicted ${entry.deploymentId} (${this.formatBytes(entry.size)})`
        );
      } catch (error) {
        console.error(`Failed to evict ${entry.deploymentId}:`, error);
      }
    }

    console.log(
      `[Cache] Eviction complete. Freed ${evicted.length} deployments. New size: ${this.formatBytes(this.totalSize)}`
    );
  }

  /**
   * Calculate total size of a directory
   */
  private async getDirectorySize(dirPath: string): Promise<number> {
    let totalSize = 0;

    try {
      const entries = await fs.readdir(dirPath, { withFileTypes: true });

      for (const entry of entries) {
        const entryPath = path.join(dirPath, entry.name);

        if (entry.isDirectory()) {
          totalSize += await this.getDirectorySize(entryPath);
        } else if (entry.isFile()) {
          const stats = await fs.stat(entryPath);
          totalSize += stats.size;
        }
      }
    } catch (error) {
      console.error(`Error calculating directory size for ${dirPath}:`, error);
    }

    return totalSize;
  }

  /**
   * Manually cleanup a specific deployment from cache
   */
  async evict(deploymentId: string): Promise<void> {
    const entry = this.cache.get(deploymentId);
    if (!entry) return;

    try {
      await fs.rm(entry.path, { recursive: true, force: true });
      this.cache.delete(deploymentId);
      this.totalSize -= entry.size;
      console.log(`[Cache] Manually evicted ${deploymentId}`);
    } catch (error) {
      console.error(`Failed to manually evict ${deploymentId}:`, error);
    }
  }

  /**
   * Cleanup all old deployments (for maintenance)
   */
  async cleanupOld(maxAgeMinutes: number = 60): Promise<void> {
    const cutoff = Date.now() - maxAgeMinutes * 60 * 1000;
    const toEvict: string[] = [];

    for (const [deploymentId, entry] of this.cache) {
      if (entry.lastAccess < cutoff) {
        toEvict.push(deploymentId);
      }
    }

    for (const deploymentId of toEvict) {
      await this.evict(deploymentId);
    }

    if (toEvict.length > 0) {
      console.log(`[Cache] Cleaned up ${toEvict.length} old deployments`);
    }
  }

  /**
   * Get cache statistics
   */
  getStats(): { entries: number; totalSize: number; maxSize: number } {
    return {
      entries: this.cache.size,
      totalSize: this.totalSize,
      maxSize: MAX_CACHE_SIZE,
    };
  }

  private formatBytes(bytes: number): string {
    if (bytes < 1024) return `${bytes}B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)}KB`;
    if (bytes < 1024 * 1024 * 1024)
      return `${(bytes / (1024 * 1024)).toFixed(2)}MB`;
    return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)}GB`;
  }
}

export const deploymentCache = new DeploymentCache();
