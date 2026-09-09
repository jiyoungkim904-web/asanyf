// ─────────────────────────────────────────────────────────────
// OpenRouter 비디오 생성 API 클라이언트 (브라우저에서 직접 호출, BYOK)
//
//   POST  /api/v1/videos              작업 제출 → { id, status, polling_url }
//   GET   /api/v1/videos/{id}         상태 폴링 → completed 시 unsigned_urls
//   GET   /api/v1/videos/{id}/content?index=0   완성 영상(mp4) 바이트 (Authorization 필요)
//   GET   /api/v1/videos/models       비디오 모델 목록 + 가격
//
// 키는 이 모듈을 호출할 때 인자로만 전달되며 저장하지 않는다.
// ─────────────────────────────────────────────────────────────

const BASE = 'https://openrouter.ai/api/v1'

export interface VideoModel {
  id: string
  canonical_slug?: string
  name: string
  description?: string
  supported_durations?: number[]
  supported_resolutions?: string[]
  supported_aspect_ratios?: string[]
  supported_sizes?: string[]
  /** SKU 이름 → 단가(USD, 문자열). 예: { "per-video-second": "0.50" } */
  pricing_skus?: Record<string, string>
  allowed_passthrough_parameters?: string[]
  frame_image_support?: boolean
}

export type VideoJobStatus =
  | 'pending'
  | 'in_progress'
  | 'processing'
  | 'queued'
  | 'completed'
  | 'failed'
  | 'cancelled'
  | 'expired'

export interface VideoJob {
  id: string
  status: VideoJobStatus
  polling_url?: string
  unsigned_urls?: string[]
  error?: { message?: string } | string
  usage?: { cost?: number; is_byok?: boolean }
}

export interface FrameImage {
  type: 'image_url'
  image_url: { url: string } // https URL 또는 data:image/...;base64,....
  frame_type: 'first_frame' | 'last_frame'
}

export interface CreateVideoInput {
  model: string
  prompt: string
  duration?: number
  resolution?: string
  aspect_ratio?: string
  size?: string
  generate_audio?: boolean
  frame_images?: FrameImage[]
}

// HTTP 헤더 값은 ISO-8859-1(라틴1)만 허용된다. 붙여넣기 과정에서 섞여 들어온
// 제로폭 공백·스마트 문자 등 비ASCII 문자를 키에서 제거한다. OpenRouter 키는 원래 ASCII.
export function sanitizeApiKey(key: string): string {
  return key.replace(/[^\x21-\x7E]/g, '')
}

function authHeaders(apiKey: string): HeadersInit {
  return {
    Authorization: `Bearer ${sanitizeApiKey(apiKey)}`,
    'Content-Type': 'application/json',
    // 브라우저 앱 식별용 (OpenRouter 관례). 헤더 값은 ASCII만 허용되므로 로마자 사용.
    'HTTP-Referer': typeof location !== 'undefined' ? location.origin : 'https://youngfarm.ai',
    'X-Title': 'YoungFarm Market AI',
  }
}

async function readError(res: Response): Promise<string> {
  let detail = ''
  try {
    const j = await res.json()
    detail = j?.error?.message || j?.message || JSON.stringify(j)
  } catch {
    detail = await res.text().catch(() => '')
  }
  if (res.status === 401) return 'API 키가 유효하지 않습니다 (401).'
  if (res.status === 402) return '크레딧이 부족합니다 (402).'
  if (res.status === 400) return `요청 값이 모델과 맞지 않습니다 (400). ${detail}`
  return `OpenRouter 오류 ${res.status}. ${detail}`.trim()
}

function corsHint(e: unknown): Error {
  const msg = e instanceof Error ? e.message : String(e)
  if (/Failed to fetch|NetworkError|CORS/i.test(msg))
    return new Error(
      '브라우저에서 OpenRouter 직접 호출이 차단됐습니다(CORS/네트워크). 네트워크 상태를 확인하거나, 배포 환경에서는 얇은 프록시 서버가 필요할 수 있습니다.',
    )
  return e instanceof Error ? e : new Error(msg)
}

export async function listVideoModels(apiKey: string): Promise<VideoModel[]> {
  try {
    const res = await fetch(`${BASE}/videos/models`, { headers: authHeaders(apiKey) })
    if (!res.ok) throw new Error(await readError(res))
    const j = await res.json()
    return (j.data ?? j.models ?? []) as VideoModel[]
  } catch (e) {
    throw corsHint(e)
  }
}

export async function createVideoJob(apiKey: string, input: CreateVideoInput): Promise<VideoJob> {
  try {
    const body: Record<string, unknown> = { model: input.model, prompt: input.prompt }
    if (input.duration) body.duration = input.duration
    if (input.resolution) body.resolution = input.resolution
    if (input.aspect_ratio) body.aspect_ratio = input.aspect_ratio
    if (input.size) body.size = input.size
    if (input.generate_audio !== undefined) body.generate_audio = input.generate_audio
    if (input.frame_images?.length) body.frame_images = input.frame_images

    const res = await fetch(`${BASE}/videos`, {
      method: 'POST',
      headers: authHeaders(apiKey),
      body: JSON.stringify(body),
    })
    if (!res.ok) throw new Error(await readError(res))
    return (await res.json()) as VideoJob
  } catch (e) {
    throw corsHint(e)
  }
}

export async function getVideoJob(apiKey: string, id: string): Promise<VideoJob> {
  try {
    const res = await fetch(`${BASE}/videos/${encodeURIComponent(id)}`, {
      headers: authHeaders(apiKey),
    })
    if (!res.ok) throw new Error(await readError(res))
    return (await res.json()) as VideoJob
  } catch (e) {
    throw corsHint(e)
  }
}

export const TERMINAL_STATUSES: VideoJobStatus[] = ['completed', 'failed', 'cancelled', 'expired']

export function jobErrorMessage(job: VideoJob): string {
  if (typeof job.error === 'string') return job.error
  return job.error?.message || `작업이 ${job.status} 상태로 종료됐습니다.`
}

/** 완성된 영상 바이트를 받아 브라우저에서 재생·다운로드 가능한 Blob 으로 돌려준다. */
export async function fetchVideoBlob(apiKey: string, job: VideoJob): Promise<Blob> {
  const url =
    job.unsigned_urls?.[0] ?? `${BASE}/videos/${encodeURIComponent(job.id)}/content?index=0`
  try {
    const res = await fetch(url, { headers: { Authorization: `Bearer ${sanitizeApiKey(apiKey)}` } })
    if (!res.ok) throw new Error(await readError(res))
    return await res.blob()
  } catch (e) {
    throw corsHint(e)
  }
}

/** 폴링 루프. onTick 으로 상태를 알려주고, 종료 상태가 되면 반환한다. */
export async function pollUntilDone(
  apiKey: string,
  id: string,
  opts: { intervalMs?: number; timeoutMs?: number; onTick?: (job: VideoJob) => void; signal?: AbortSignal } = {},
): Promise<VideoJob> {
  const interval = opts.intervalMs ?? 5000
  const timeout = opts.timeoutMs ?? 10 * 60 * 1000
  const started = Date.now()
  while (true) {
    if (opts.signal?.aborted) throw new Error('취소됨')
    const job = await getVideoJob(apiKey, id)
    opts.onTick?.(job)
    if (TERMINAL_STATUSES.includes(job.status)) return job
    if (Date.now() - started > timeout) throw new Error('시간 초과: 생성이 너무 오래 걸립니다.')
    await new Promise((r) => setTimeout(r, interval))
  }
}

// ── 가격 표시 헬퍼 ────────────────────────────────────────────

/** pricing_skus 를 "항목 $단가" 문자열 배열로. */
export function formatPricing(m: VideoModel): string[] {
  if (!m.pricing_skus) return []
  return Object.entries(m.pricing_skus).map(([sku, price]) => {
    const label = sku
      .replace(/^per-/, '')
      .replace(/-/g, ' ')
      .replace('video second', '영상 1초당')
      .replace('video', '영상당')
    const n = Number(price)
    return `${label}: $${Number.isFinite(n) ? n.toFixed(n < 0.01 ? 5 : 3) : price}`
  })
}

/** 선택한 길이 기준 대략 비용(USD) 추정. 정확치 않을 수 있음. */
export function estimateCost(m: VideoModel, durationSec?: number, resolution?: string): number | null {
  if (!m.pricing_skus) return null
  const skus = m.pricing_skus
  const perSecKey =
    (resolution && Object.keys(skus).find((k) => k.includes('second') && k.includes(resolution))) ||
    Object.keys(skus).find((k) => k.includes('second'))
  if (perSecKey && durationSec) {
    const v = Number(skus[perSecKey])
    if (Number.isFinite(v)) return v * durationSec
  }
  const perVideoKey = Object.keys(skus).find((k) => k.includes('video') && !k.includes('second'))
  if (perVideoKey) {
    const v = Number(skus[perVideoKey])
    if (Number.isFinite(v)) return v
  }
  return null
}
