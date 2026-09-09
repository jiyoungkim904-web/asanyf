// ─────────────────────────────────────────────────────────────
// 생성된 영상(mp4 등)을 브라우저에 영구 보관한다.
//
// localStorage 는 용량이 작고 바이너리에 부적합하므로 IndexedDB 사용.
// 새로고침·탭 종료 후에도 "내가 만든 영상"이 남는다.
// (브라우저별 로컬 저장이므로 다른 기기/브라우저에는 공유되지 않음 — 프로토타입 한정)
// ─────────────────────────────────────────────────────────────

const DB_NAME = 'youngfarm-videos'
const STORE = 'videos'

export interface StoredVideo {
  id: string
  blob: Blob
  mime: string
  model: string
  prompt: string
  cost?: number
  createdAt: string
  farmId?: string
  productId?: string
  label?: string
}

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, 1)
    req.onupgradeneeded = () => {
      const db = req.result
      if (!db.objectStoreNames.contains(STORE)) {
        db.createObjectStore(STORE, { keyPath: 'id' })
      }
    }
    req.onsuccess = () => resolve(req.result)
    req.onerror = () => reject(req.error ?? new Error('IndexedDB 열기 실패'))
  })
}

function tx<T>(mode: IDBTransactionMode, fn: (store: IDBObjectStore) => IDBRequest<T>): Promise<T> {
  return openDb().then(
    (db) =>
      new Promise<T>((resolve, reject) => {
        const t = db.transaction(STORE, mode)
        const req = fn(t.objectStore(STORE))
        req.onsuccess = () => resolve(req.result)
        req.onerror = () => reject(req.error ?? new Error('IndexedDB 요청 실패'))
        t.oncomplete = () => db.close()
      }),
  )
}

const rid = () => `vid_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 7)}`

export async function saveVideo(input: Omit<StoredVideo, 'id' | 'createdAt'>): Promise<StoredVideo> {
  const rec: StoredVideo = { ...input, id: rid(), createdAt: new Date().toISOString() }
  await tx('readwrite', (s) => s.put(rec))
  return rec
}

export async function getVideo(id: string): Promise<StoredVideo | undefined> {
  return tx<StoredVideo | undefined>('readonly', (s) => s.get(id) as IDBRequest<StoredVideo | undefined>)
}

export async function listVideos(): Promise<StoredVideo[]> {
  const all = await tx<StoredVideo[]>('readonly', (s) => s.getAll() as IDBRequest<StoredVideo[]>)
  return all.sort((a, b) => b.createdAt.localeCompare(a.createdAt))
}

export async function deleteVideo(id: string): Promise<void> {
  await tx('readwrite', (s) => s.delete(id))
}

export async function updateVideoMeta(
  id: string,
  patch: Partial<Pick<StoredVideo, 'farmId' | 'productId' | 'label'>>,
): Promise<void> {
  const cur = await getVideo(id)
  if (!cur) return
  await tx('readwrite', (s) => s.put({ ...cur, ...patch }))
}

/** IndexedDB 에서 영상을 꺼내 재생·다운로드용 object URL 로. 없으면 null. */
export async function videoObjectUrl(id: string): Promise<string | null> {
  const v = await getVideo(id)
  return v ? URL.createObjectURL(v.blob) : null
}
