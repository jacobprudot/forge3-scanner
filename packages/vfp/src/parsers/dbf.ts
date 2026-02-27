import { open } from "node:fs/promises"
import type { DbfField, DbfTableInfo } from "../types.js"

/**
 * DBF Header structure (first 32 bytes):
 *   Byte 0:      Version byte
 *   Bytes 1-3:   Last update date (YY, MM, DD)
 *   Bytes 4-7:   Number of records (little-endian uint32)
 *   Bytes 8-9:   Header length (little-endian uint16)
 *   Bytes 10-11: Record length (little-endian uint16)
 *
 * Field descriptors start at byte 32, each 32 bytes:
 *   Bytes 0-10:  Field name (null-terminated)
 *   Byte 11:     Field type (C, N, D, L, M, G, etc.)
 *   Bytes 16:    Field length
 *   Bytes 17:    Decimal count
 *
 * Header ends with 0x0D terminator byte.
 */

const FIELD_DESCRIPTOR_SIZE = 32
const HEADER_SIZE = 32

export async function parseDbfHeader(filePath: string): Promise<DbfTableInfo> {
  const fh = await open(filePath, "r")
  try {
    const headerBuf = Buffer.alloc(HEADER_SIZE)
    await fh.read(headerBuf, 0, HEADER_SIZE, 0)

    const version = headerBuf[0]
    const lastModYear = 1900 + headerBuf[1]
    const lastModMonth = headerBuf[2]
    const lastModDay = headerBuf[3]
    const lastModified = new Date(lastModYear, lastModMonth - 1, lastModDay)

    const recordCount = headerBuf.readUInt32LE(4)
    const headerLength = headerBuf.readUInt16LE(8)
    const recordLength = headerBuf.readUInt16LE(10)

    // Calculate number of fields: (headerLength - HEADER_SIZE - 1) / 32
    const fieldCount = Math.floor((headerLength - HEADER_SIZE - 1) / FIELD_DESCRIPTOR_SIZE)

    const fields: DbfField[] = []
    let hasMemo = false
    let hasGeneral = false

    if (fieldCount > 0 && fieldCount < 256) {
      const fieldsBuf = Buffer.alloc(fieldCount * FIELD_DESCRIPTOR_SIZE)
      await fh.read(fieldsBuf, 0, fieldsBuf.length, HEADER_SIZE)

      for (let i = 0; i < fieldCount; i++) {
        const offset = i * FIELD_DESCRIPTOR_SIZE

        // Read field name (null-terminated, up to 11 bytes)
        let nameEnd = 11
        for (let j = 0; j < 11; j++) {
          if (fieldsBuf[offset + j] === 0) {
            nameEnd = j
            break
          }
        }
        const name = fieldsBuf.toString("ascii", offset, offset + nameEnd).trim()
        const type = String.fromCharCode(fieldsBuf[offset + 11])
        const length = fieldsBuf[offset + 16]
        const decimals = fieldsBuf[offset + 17]

        if (type === "M") hasMemo = true
        if (type === "G") hasGeneral = true

        fields.push({ name, type, length, decimals })
      }
    }

    // Get file size
    const stat = await fh.stat()

    const name = filePath.split(/[\\/]/).pop()?.replace(/\.dbf$/i, "") ?? filePath

    return {
      path: filePath,
      name,
      recordCount,
      fieldCount: fields.length,
      sizeBytes: stat.size,
      lastModified,
      fields,
      hasMemo,
      hasGeneral,
    }
  } finally {
    await fh.close()
  }
}
