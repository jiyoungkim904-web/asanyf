/** 업로드 이미지를 축소해 data URL 로 변환한다 (localStorage 용량 절약). */
export function fileToDataUrl(file: File, maxSize = 720, quality = 0.72): Promise<string> {
  return new Promise((resolve, reject) => {
    if (!file.type.startsWith('image/')) {
      reject(new Error('이미지 파일만 올릴 수 있어요.'))
      return
    }
    const reader = new FileReader()
    reader.onerror = () => reject(new Error('사진을 읽지 못했어요.'))
    reader.onload = () => {
      const img = new Image()
      img.onerror = () => reject(new Error('사진을 열지 못했어요.'))
      img.onload = () => {
        const scale = Math.min(1, maxSize / Math.max(img.width, img.height))
        const w = Math.round(img.width * scale)
        const h = Math.round(img.height * scale)
        const canvas = document.createElement('canvas')
        canvas.width = w
        canvas.height = h
        const ctx = canvas.getContext('2d')
        if (!ctx) {
          resolve(reader.result as string)
          return
        }
        ctx.drawImage(img, 0, 0, w, h)
        resolve(canvas.toDataURL('image/jpeg', quality))
      }
      img.src = reader.result as string
    }
    reader.readAsDataURL(file)
  })
}
