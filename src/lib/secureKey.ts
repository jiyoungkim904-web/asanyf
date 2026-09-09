// ─────────────────────────────────────────────────────────────
// OpenRouter API 키를 브라우저에 "암호화해서" 보관한다. (패스프레이즈 없음)
//
//  · 이 브라우저 전용 암호화 키(AES-GCM, extractable:false)를 IndexedDB 에 생성·보관
//  · API 키는 그 키로 암호화해 localStorage 에 (iv/ciphertext) 저장
//  · 같은 브라우저에서는 자동 복호화 → 매번 입력할 필요 없음
//  · 전송 시   : 평문 키는 오직 https://openrouter.ai 로만, TLS(HTTPS) 위에서
//
// 평문 키는 디스크에 남지 않고, 암호화 키는 브라우저 밖으로 못 꺼낸다(non-extractable).
// ─────────────────────────────────────────────────────────────

const STORAGE_KEY = 'youngfarm.openrouter.key.v2'
const IDB_NAME = 'youngfarm-secure'
const IDB_STORE = 'keys'
const IDB_KEY_ID = 'deviceKey'

interface StoredBlob {
  v: 2
  iv: string // base64
  ct: string // base64
}

const enc = new TextEncoder()
const dec = new TextDecoder()
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
const asciiOnly = (s: string) => s.replace(/[^\x21-\x7E]/g, '')

function idb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(IDB_NAME, 1)
    req.onupgradeneeded = () => {
      if (!req.result.objectStoreNames.contains(IDB_STORE)) req.result.createObjectStore(IDB_STORE)
    }
    req.onsuccess = () => resolve(req.result)
    req.onerror = () => reject(req.error ?? new Error('IndexedDB 열기 실패'))
  })
}

function idbGet(key: string): Promise<CryptoKey | undefined> {
  return idb().then(
    (db) =>
      new Promise((resolve, reject) => {
        const r = db.transaction(IDB_STORE, 'readonly').objectStore(IDB_STORE).get(key)
        r.onsuccess = () => resolve(r.result)
        r.onerror = () => reject(r.error)
      }),
  )
}
function idbPut(key: string, val: CryptoKey): Promise<void> {
  return idb().then(
    (db) =>
      new Promise((resolve, reject) => {
        const r = db.transaction(IDB_STORE, 'readwrite').objectStore(IDB_STORE).put(val, key)
        r.onsuccess = () => resolve()
        r.onerror = () => reject(r.error)
      }),
  )
}
function idbDel(key: string): Promise<void> {
  return idb().then(
    (db) =>
      new Promise((resolve, reject) => {
        const r = db.transaction(IDB_STORE, 'readwrite').objectStore(IDB_STORE).delete(key)
        r.onsuccess = () => resolve()
        r.onerror = () => reject(r.error)
      }),
  )
}

async function getDeviceKey(create: boolean): Promise<CryptoKey | null> {
  const existing = await idbGet(IDB_KEY_ID)
  if (existing) return existing
  if (!create) return null
  const key = await crypto.subtle.generateKey({ name: 'AES-GCM', length: 256 }, false, [
    'encrypt',
    'decrypt',
  ])
  await idbPut(IDB_KEY_ID, key)
  return key
}

export function hasStoredKey(): boolean {
  try {
    return !!localStorage.getItem(STORAGE_KEY)
  } catch {
    return false
  }
}

export async function clearStoredKey(): Promise<void> {
  try {
    localStorage.removeItem(STORAGE_KEY)
  } catch {
    /* noop */
  }
  try {
    await idbDel(IDB_KEY_ID)
  } catch {
    /* noop */
  }
}

/** API 키를 이 브라우저 전용 키로 암호화해 저장한다. */
export async function saveKey(apiKey: string): Promise<string> {
  const clean = asciiOnly(apiKey)
  if (!clean) throw new Error('API 키를 입력해주세요.')
  const key = await getDeviceKey(true)
  if (!key) throw new Error('브라우저 저장소를 사용할 수 없습니다.')
  const iv = crypto.getRandomValues(new Uint8Array(12))
  const ct = await crypto.subtle.encrypt({ name: 'AES-GCM', iv: bs(iv) }, key, bs(enc.encode(clean)))
  const blob: StoredBlob = { v: 2, iv: toB64(iv), ct: toB64(ct) }
  localStorage.setItem(STORAGE_KEY, JSON.stringify(blob))
  localStorage.removeItem('youngfarm.openrouter.key.v1') // 옛 패스프레이즈 방식 잔재 정리
  return clean
}

/** 저장된 API 키를 복호화해 돌려준다. 없거나 실패하면 null. */
export async function loadKey(): Promise<string | null> {
  if (typeof indexedDB === 'undefined') return null
  let raw: string | null = null
  try {
    raw = localStorage.getItem(STORAGE_KEY)
  } catch {
    return null
  }
  if (!raw) return null
  try {
    const blob = JSON.parse(raw) as StoredBlob
    const key = await getDeviceKey(false)
    if (!key) return null
    const pt = await crypto.subtle.decrypt(
      { name: 'AES-GCM', iv: bs(fromB64(blob.iv)) },
      key,
      bs(fromB64(blob.ct)),
    )
    return asciiOnly(dec.decode(pt))
  } catch {
    return null
  }
}
