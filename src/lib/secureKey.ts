// ─────────────────────────────────────────────────────────────
// OpenRouter API 키를 브라우저에 "암호화해서" 보관한다.
//
//  · 저장 시   : 사용자가 정한 패스프레이즈 → PBKDF2(SHA-256, 210k) → AES-GCM 키
//                → API 키를 암호화해 localStorage 에 (salt/iv/ciphertext) 저장
//  · 사용 시   : 패스프레이즈로 복호화해 메모리(React state)에만 올림
//  · 전송 시   : 평문 키는 오직 https://openrouter.ai 로만, TLS(HTTPS) 위에서 전송
//
// 평문 키는 디스크에 남지 않는다. 잠금 해제된 키는 새로고침하면 사라진다.
// ─────────────────────────────────────────────────────────────

const STORAGE_KEY = 'youngfarm.openrouter.key.v1'
const PBKDF2_ITERATIONS = 210_000

interface StoredBlob {
  v: 1
  salt: string // base64
  iv: string // base64
  ct: string // base64
  hint?: string
}

const enc = new TextEncoder()
const dec = new TextDecoder()

// TS lib.dom 의 BufferSource 제네릭(SharedArrayBuffer) 불일치 회피용
const bs = (u: Uint8Array): BufferSource => u as unknown as BufferSource

function toB64(buf: ArrayBuffer | Uint8Array): string {
  const bytes = buf instanceof Uint8Array ? buf : new Uint8Array(buf)
  let s = ''
  for (const b of bytes) s += String.fromCharCode(b)
  return btoa(s)
}

function fromB64(s: string): Uint8Array {
  const bin = atob(s)
  const out = new Uint8Array(bin.length)
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i)
  return out
}

async function deriveAesKey(passphrase: string, salt: Uint8Array): Promise<CryptoKey> {
  const baseKey = await crypto.subtle.importKey(
    'raw',
    bs(enc.encode(passphrase)),
    'PBKDF2',
    false,
    ['deriveKey'],
  )
  return crypto.subtle.deriveKey(
    { name: 'PBKDF2', salt: bs(salt), iterations: PBKDF2_ITERATIONS, hash: 'SHA-256' },
    baseKey,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt'],
  )
}

export function hasStoredKey(): boolean {
  return !!localStorage.getItem(STORAGE_KEY)
}

export function storedKeyHint(): string | undefined {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return undefined
    return (JSON.parse(raw) as StoredBlob).hint
  } catch {
    return undefined
  }
}

export function clearStoredKey(): void {
  localStorage.removeItem(STORAGE_KEY)
}

/** API 키를 패스프레이즈로 암호화해 저장한다. */
export async function saveKey(apiKey: string, passphrase: string, hint?: string): Promise<void> {
  // 붙여넣기로 섞인 비ASCII 문자 제거 — HTTP 헤더는 ISO-8859-1만 허용
  apiKey = apiKey.replace(/[^\x21-\x7E]/g, '')
  if (!apiKey) throw new Error('API 키를 입력해주세요.')
  if (passphrase.length < 4) throw new Error('패스프레이즈는 4자 이상이어야 합니다.')
  const salt = crypto.getRandomValues(new Uint8Array(16))
  const iv = crypto.getRandomValues(new Uint8Array(12))
  const aesKey = await deriveAesKey(passphrase, salt)
  const ct = await crypto.subtle.encrypt({ name: 'AES-GCM', iv: bs(iv) }, aesKey, enc.encode(apiKey.trim()))
  const blob: StoredBlob = { v: 1, salt: toB64(salt), iv: toB64(iv), ct: toB64(ct), hint }
  localStorage.setItem(STORAGE_KEY, JSON.stringify(blob))
}

/** 저장된 암호문을 패스프레이즈로 복호화해 평문 API 키를 돌려준다. */
export async function unlockKey(passphrase: string): Promise<string> {
  const raw = localStorage.getItem(STORAGE_KEY)
  if (!raw) throw new Error('저장된 키가 없습니다.')
  const blob = JSON.parse(raw) as StoredBlob
  const aesKey = await deriveAesKey(passphrase, fromB64(blob.salt))
  try {
    const pt = await crypto.subtle.decrypt(
      { name: 'AES-GCM', iv: bs(fromB64(blob.iv)) },
      aesKey,
      bs(fromB64(blob.ct)),
    )
    // 예전에 저장된 키에 비ASCII가 남아있어도 여기서 정리
    return dec.decode(pt).replace(/[^\x21-\x7E]/g, '')
  } catch {
    throw new Error('패스프레이즈가 올바르지 않습니다.')
  }
}
