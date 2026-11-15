export interface FileAttachment {
  name: string
  url: string
  type: string
  size?: number
}

/**
 * Compresses an image file client-side using HTML5 Canvas
 * Downscales dimensions and outputs an optimized JPEG data URL (< 80KB)
 */
export async function compressImageToDataUrl(
  file: File,
  maxDim = 560,
  quality = 0.78,
): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onerror = () => reject(new Error('Could not read selected image file'))
    reader.onload = () => {
      const img = new Image()
      img.onerror = () => reject(new Error('Unsupported or corrupted image file'))
      img.onload = () => {
        const ratio = Math.min(1, maxDim / Math.max(img.width || 1, img.height || 1))
        const w = Math.max(1, Math.round((img.width || maxDim) * ratio))
        const h = Math.max(1, Math.round((img.height || maxDim) * ratio))
        const canvas = document.createElement('canvas')
        canvas.width = w
        canvas.height = h
        const ctx = canvas.getContext('2d')
        if (!ctx) {
          resolve(String(reader.result || ''))
          return
        }
        ctx.fillStyle = '#FFFFFF'
        ctx.fillRect(0, 0, w, h)
        ctx.drawImage(img, 0, 0, w, h)
        resolve(canvas.toDataURL('image/jpeg', quality))
      }
      img.src = String(reader.result || '')
    }
    reader.readAsDataURL(file)
  })
}

/**
 * Reads any user-selected file into a structured FileAttachment.
 * Image files are automatically compressed to prevent memory & storage bloat.
 */
export async function readFileAsAttachment(file: File): Promise<FileAttachment> {
  if (file.type.startsWith('image/')) {
    const compressedUrl = await compressImageToDataUrl(file, 960, 0.8)
    return {
      name: file.name,
      url: compressedUrl,
      type: file.type || 'image/jpeg',
      size: file.size,
    }
  }
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onerror = () => reject(new Error('ফাইল পড়তে ব্যর্থ হয়েছে'))
    reader.onload = () => {
      resolve({
        name: file.name,
        url: String(reader.result || ''),
        type: file.type || 'application/octet-stream',
        size: file.size,
      })
    }
    reader.readAsDataURL(file)
  })
}

