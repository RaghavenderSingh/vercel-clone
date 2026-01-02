import AdmZip from "adm-zip";
import path from "path";

const MAX_UNCOMPRESSED_SIZE = 500 * 1024 * 1024; // 500MB
const MAX_FILE_COUNT = 10000;

export interface ZipValidationResult {
  valid: boolean;
  error?: string;
  stats?: {
    fileCount: number;
    uncompressedSize: number;
  };
}

/**
 * Validates a zip file for security issues:
 * - Path traversal attacks
 * - Zip bombs (excessive uncompressed size)
 * - Too many files
 */
export function validateZip(zipPath: string): ZipValidationResult {
  try {
    const zip = new AdmZip(zipPath);
    const entries = zip.getEntries();

    if (entries.length > MAX_FILE_COUNT) {
      return {
        valid: false,
        error: `Zip contains too many files (${entries.length}). Maximum allowed: ${MAX_FILE_COUNT}`
      };
    }

    let totalUncompressedSize = 0;

    for (const entry of entries) {
      // Check for path traversal
      const normalizedPath = path.normalize(entry.entryName);

      // Detect path traversal attempts
      if (normalizedPath.startsWith("..") || path.isAbsolute(normalizedPath)) {
        return {
          valid: false,
          error: `Path traversal detected: ${entry.entryName}`
        };
      }

      // Check for suspicious paths
      if (normalizedPath.includes("../") || normalizedPath.includes("..\\")) {
        return {
          valid: false,
          error: `Suspicious path detected: ${entry.entryName}`
        };
      }

      // Accumulate uncompressed size
      totalUncompressedSize += entry.header.size;

      // Check for zip bomb
      if (totalUncompressedSize > MAX_UNCOMPRESSED_SIZE) {
        return {
          valid: false,
          error: `Zip bomb detected: uncompressed size (${formatBytes(totalUncompressedSize)}) exceeds maximum (${formatBytes(MAX_UNCOMPRESSED_SIZE)})`
        };
      }

      // Check compression ratio for each file (another zip bomb indicator)
      if (entry.header.size > 0 && entry.header.compressedSize > 0) {
        const compressionRatio = entry.header.size / entry.header.compressedSize;
        if (compressionRatio > 100) {
          return {
            valid: false,
            error: `Suspicious compression ratio detected in ${entry.entryName} (${compressionRatio.toFixed(2)}:1)`
          };
        }
      }
    }

    return {
      valid: true,
      stats: {
        fileCount: entries.length,
        uncompressedSize: totalUncompressedSize
      }
    };
  } catch (error) {
    return {
      valid: false,
      error: `Failed to validate zip: ${error instanceof Error ? error.message : String(error)}`
    };
  }
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes}B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)}KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(2)}MB`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)}GB`;
}
