import { deflateRawSync } from 'node:zlib';

export interface ZipEntry {
  path: string;
  content: string | Buffer;
}

// Precomputed CRC32 lookup table
const CRC_TABLE = new Uint32Array(256);
for (let i = 0; i < 256; i++) {
  let c = i;
  for (let k = 0; k < 8; k++) {
    c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  }
  CRC_TABLE[i] = c >>> 0;
}

function crc32(buffer: Buffer): number {
  let crc = 0xffffffff;
  for (let i = 0; i < buffer.length; i++) {
    crc = (crc >>> 8) ^ CRC_TABLE[(crc ^ buffer[i]) & 0xff];
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function dosDateTime(date: Date = new Date()): { time: number; date: number } {
  const time =
    ((date.getHours() & 0x1f) << 11) |
    ((date.getMinutes() & 0x3f) << 5) |
    ((Math.floor(date.getSeconds() / 2) & 0x1f) << 0);

  const d =
    (((date.getFullYear() - 1980) & 0x7f) << 9) |
    (((date.getMonth() + 1) & 0x0f) << 5) |
    ((date.getDate() & 0x1f) << 0);

  return { time, date: d };
}

/**
 * Creates a valid ZIP archive buffer from a list of file entries.
 * Pure Node.js implementation using zlib deflateRaw.
 */
export function createZipBuffer(entries: ZipEntry[]): Buffer {
  const localFileChunks: Buffer[] = [];
  const centralDirChunks: Buffer[] = [];

  let offset = 0;
  const now = new Date();
  const { time: dosTime, date: dosDate } = dosDateTime(now);

  for (const entry of entries) {
    // Normalize file path (strip leading slashes, use forward slashes)
    const normalizedPath = entry.path.replace(/^[/\\]+/, '').replace(/\\/g, '/');
    if (!normalizedPath) continue;

    const pathBuffer = Buffer.from(normalizedPath, 'utf-8');
    const contentBuffer =
      typeof entry.content === 'string'
        ? Buffer.from(entry.content, 'utf-8')
        : entry.content;

    const uncompressedSize = contentBuffer.length;
    const fileCrc = crc32(contentBuffer);

    // Compress using deflate
    let compressedData = deflateRawSync(contentBuffer, { level: 6 });
    let compressionMethod = 8; // Deflated

    // If compression didn't help (e.g. tiny string), store uncompressed
    if (compressedData.length >= uncompressedSize) {
      compressedData = contentBuffer;
      compressionMethod = 0; // Stored
    }

    const compressedSize = compressedData.length;

    // ── Local File Header (30 bytes + path length) ──────────────────────────
    const localHeader = Buffer.alloc(30 + pathBuffer.length);
    localHeader.writeUInt32LE(0x04034b50, 0); // Local header signature
    localHeader.writeUInt16LE(20, 4); // Min version needed (2.0)
    localHeader.writeUInt16LE(0x0800, 6); // General purpose bit flag (UTF-8)
    localHeader.writeUInt16LE(compressionMethod, 8); // Compression method
    localHeader.writeUInt16LE(dosTime, 10);
    localHeader.writeUInt16LE(dosDate, 12);
    localHeader.writeUInt32LE(fileCrc, 14); // CRC32
    localHeader.writeUInt32LE(compressedSize, 18); // Compressed size
    localHeader.writeUInt32LE(uncompressedSize, 22); // Uncompressed size
    localHeader.writeUInt16LE(pathBuffer.length, 26); // Path length
    localHeader.writeUInt16LE(0, 28); // Extra field length
    pathBuffer.copy(localHeader, 30);

    localFileChunks.push(localHeader, compressedData);

    // ── Central Directory Header (46 bytes + path length) ───────────────────
    const centralHeader = Buffer.alloc(46 + pathBuffer.length);
    centralHeader.writeUInt32LE(0x02014b50, 0); // Central directory signature
    centralHeader.writeUInt16LE(20, 4); // Version made by
    centralHeader.writeUInt16LE(20, 6); // Version needed to extract
    centralHeader.writeUInt16LE(0x0800, 8); // General purpose bit flag (UTF-8)
    centralHeader.writeUInt16LE(compressionMethod, 10); // Compression method
    centralHeader.writeUInt16LE(dosTime, 12);
    centralHeader.writeUInt16LE(dosDate, 14);
    centralHeader.writeUInt32LE(fileCrc, 16);
    centralHeader.writeUInt32LE(compressedSize, 20);
    centralHeader.writeUInt32LE(uncompressedSize, 24);
    centralHeader.writeUInt16LE(pathBuffer.length, 28);
    centralHeader.writeUInt16LE(0, 30); // Extra field length
    centralHeader.writeUInt16LE(0, 32); // File comment length
    centralHeader.writeUInt16LE(0, 34); // Disk number start
    centralHeader.writeUInt16LE(0, 36); // Internal file attributes
    centralHeader.writeUInt32LE(0x81a40000, 38); // External file attributes (regular file 0644)
    centralHeader.writeUInt32LE(offset, 42); // Relative offset of local header
    pathBuffer.copy(centralHeader, 46);

    centralDirChunks.push(centralHeader);

    offset += localHeader.length + compressedData.length;
  }

  const centralDirBuffer = Buffer.concat(centralDirChunks);
  const centralDirSize = centralDirBuffer.length;
  const centralDirOffset = offset;
  const totalEntries = centralDirChunks.length;

  // ── End of Central Directory Record (22 bytes) ───────────────────────────
  const eocd = Buffer.alloc(22);
  eocd.writeUInt32LE(0x06054b50, 0); // EOCD signature
  eocd.writeUInt16LE(0, 4); // Disk number
  eocd.writeUInt16LE(0, 6); // Disk with central directory
  eocd.writeUInt16LE(totalEntries, 8); // Entries on this disk
  eocd.writeUInt16LE(totalEntries, 10); // Total entries
  eocd.writeUInt32LE(centralDirSize, 12); // Size of central directory
  eocd.writeUInt32LE(centralDirOffset, 16); // Offset of start of central directory
  eocd.writeUInt16LE(0, 20); // Comment length

  return Buffer.concat([...localFileChunks, centralDirBuffer, eocd]);
}
