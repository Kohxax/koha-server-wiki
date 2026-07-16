import { mkdir, writeFile } from 'node:fs/promises'
import sharp from 'sharp'

const source = 'app/assets/images/face.png'
const publicDir = 'public'

await mkdir(publicDir, { recursive: true })
await sharp(source).webp({ quality: 90 }).toFile('app/assets/images/face.webp')

const images = await Promise.all([16, 32].map(size =>
  sharp(source).resize(size, size).png().toBuffer(),
))
const headerSize = 6 + images.length * 16
const header = Buffer.alloc(headerSize)
header.writeUInt16LE(0, 0)
header.writeUInt16LE(1, 2)
header.writeUInt16LE(images.length, 4)

let offset = headerSize
for (const [index, image] of images.entries()) {
  const entry = 6 + index * 16
  const size = index === 0 ? 16 : 32
  header.writeUInt8(size, entry)
  header.writeUInt8(size, entry + 1)
  header.writeUInt16LE(1, entry + 4)
  header.writeUInt16LE(32, entry + 6)
  header.writeUInt32LE(image.length, entry + 8)
  header.writeUInt32LE(offset, entry + 12)
  offset += image.length
}

await writeFile('public/favicon.ico', Buffer.concat([header, ...images]))
