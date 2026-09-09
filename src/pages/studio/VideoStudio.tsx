import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { api } from '../../lib/api'
import { Button, Field, Loading, Notice } from '../../components/ui'
import { DetailVideoPlayer } from '../../components/DetailVideoPlayer'
import {
  clearStoredKey,
  hasStoredKey,
  saveKey,
  storedKeyHint,
  unlockKey,
} from '../../lib/secureKey'
import {
  createVideoJob,
  estimateCost,
  fetchVideoBlob,
  formatPricing,
  jobErrorMessage,
  listVideoModels,
  pollUntilDone,
  type FrameImage,
  type VideoJob,
  type VideoModel,
} from '../../lib/openrouter'
import {
  deleteVideo,
  listVideos,
  saveVideo,
  updateVideoMeta,
  type StoredVideo,
} from '../../lib/videoStore'
import type { DetailPage, Farm, FarmProduct } from '../../lib/types'

interface DpRow {
  detailPage: DetailPage
  farm?: Farm
  product?: FarmProduct
}

type KeyState = 'none' | 'locked' | 'unlocked'

function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const r = new FileReader()
    r.onload = () => resolve(r.result as string)
    r.onerror = () => reject(new Error('이미지를 읽지 못했습니다.'))
    r.readAsDataURL(file)
  })
}

export default function VideoStudio() {
  const [keyState, setKeyState] = useState<KeyState>(hasStoredKey() ? 'locked' : 'none')
  const [apiKey, setApiKey] = useState<string | null>(null)
  const inAdmin = useLocation().pathname.startsWith('/admin')

  return (
    <div className="page">
      <div className="container stack" style={{ gap: 22, maxWidth: 900 }}>
        <div>
          <Link to={inAdmin ? '/admin' : '/'} className="back-link">
            {inAdmin ? '← 운영자 대시보드' : '← 영팜마켓AI 홈'}
          </Link>
          <h1 className="section-title" style={{ fontSize: 24 }}>
            AI 영상 생성 스튜디오 <span className="badge badge-info">OpenRouter 연동</span>
          </h1>
          <p className="muted">
            텍스트·이미지를 넣으면 OpenRouter의 비디오 생성 모델로 실제 영상을 만듭니다. 내 OpenRouter API
            키를 브라우저에 암호화해 보관하고, 호출은 HTTPS로 OpenRouter에만 전송됩니다.
          </p>
        </div>

        {keyState === 'none' && (
          <KeySetup
            onDone={(k) => {
              setApiKey(k)
              setKeyState('unlocked')
            }}
          />
        )}

        {keyState === 'locked' && (
          <KeyUnlock
            onUnlock={(k) => {
              setApiKey(k)
              setKeyState('unlocked')
            }}
            onForget={() => {
              clearStoredKey()
              setKeyState('none')
            }}
          />
        )}

        {keyState === 'unlocked' && apiKey && (
          <Generator
            apiKey={apiKey}
            onLock={() => {
              setApiKey(null)
              setKeyState(hasStoredKey() ? 'locked' : 'none')
            }}
            onForget={() => {
              clearStoredKey()
              setApiKey(null)
              setKeyState('none')
            }}
          />
        )}
      </div>
    </div>
  )
}

// ── 키 최초 등록 ─────────────────────────────────────────────

function KeySetup({ onDone }: { onDone: (apiKey: string) => void }) {
  const [apiKey, setApiKey] = useState('')
  const [pass, setPass] = useState('')
  const [pass2, setPass2] = useState('')
  const [hint, setHint] = useState('')
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState('')

  async function submit() {
    setErr('')
    if (!apiKey.trim()) return setErr('OpenRouter API 키를 입력해주세요.')
    if (pass.length < 4) return setErr('패스프레이즈는 4자 이상이어야 합니다.')
    if (pass !== pass2) return setErr('패스프레이즈가 서로 다릅니다.')
    setBusy(true)
    try {
      const clean = apiKey.replace(/[^\x21-\x7E]/g, '')
      await saveKey(clean, pass, hint.trim() || undefined)
      onDone(clean)
    } catch (e) {
      setErr((e as Error).message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="card card-pad stack" style={{ gap: 16 }}>
      <b style={{ fontSize: 16 }}>1) OpenRouter API 키 등록</b>
      <Notice tone="info">
        키는 <b>패스프레이즈로 AES-GCM 암호화</b>되어 이 브라우저의 localStorage에만 저장됩니다. 평문 키는
        디스크에 남지 않고, 새로고침하면 패스프레이즈로 다시 잠금 해제해야 합니다.{' '}
        <a href="https://openrouter.ai/keys" target="_blank" rel="noreferrer">
          키 발급 →
        </a>
      </Notice>
      {err && <Notice tone="danger">{err}</Notice>}
      <Field label="OpenRouter API 키" required>
        <input
          className="input"
          type="password"
          placeholder="sk-or-v1-..."
          value={apiKey}
          onChange={(e) => setApiKey(e.target.value)}
          autoComplete="off"
        />
      </Field>
      <div className="row" style={{ gap: 12, flexWrap: 'wrap' }}>
        <div style={{ flex: 1, minWidth: 190 }}>
          <Field label="패스프레이즈" required>
            <input
              className="input"
              type="password"
              value={pass}
              onChange={(e) => setPass(e.target.value)}
              autoComplete="new-password"
            />
          </Field>
        </div>
        <div style={{ flex: 1, minWidth: 190 }}>
          <Field label="패스프레이즈 확인" required>
            <input
              className="input"
              type="password"
              value={pass2}
              onChange={(e) => setPass2(e.target.value)}
              autoComplete="new-password"
            />
          </Field>
        </div>
      </div>
      <Field label="힌트 (선택)" hint="패스프레이즈 자체가 아니라 떠올릴 단서만 적으세요.">
        <input className="input" value={hint} onChange={(e) => setHint(e.target.value)} />
      </Field>
      <div>
        <Button onClick={submit} loading={busy}>
          암호화해서 저장
        </Button>
      </div>
    </div>
  )
}

// ── 잠금 해제 ───────────────────────────────────────────────

function KeyUnlock({
  onUnlock,
  onForget,
}: {
  onUnlock: (apiKey: string) => void
  onForget: () => void
}) {
  const [pass, setPass] = useState('')
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState('')
  const hint = storedKeyHint()

  async function submit() {
    setErr('')
    setBusy(true)
    try {
      const k = await unlockKey(pass)
      onUnlock(k)
    } catch (e) {
      setErr((e as Error).message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="card card-pad stack" style={{ gap: 16 }}>
      <b style={{ fontSize: 16 }}>저장된 키 잠금 해제</b>
      {hint && <p className="muted" style={{ fontSize: 13 }}>힌트: {hint}</p>}
      {err && <Notice tone="danger">{err}</Notice>}
      <Field label="패스프레이즈" required>
        <input
          className="input"
          type="password"
          value={pass}
          onChange={(e) => setPass(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && submit()}
          autoComplete="off"
        />
      </Field>
      <div className="row" style={{ gap: 10 }}>
        <Button onClick={submit} loading={busy}>
          잠금 해제
        </Button>
        <Button
          variant="ghost"
          onClick={() => {
            if (confirm('저장된 암호화 키를 삭제할까요? 다시 등록해야 합니다.')) onForget()
          }}
        >
          저장된 키 삭제
        </Button>
      </div>
    </div>
  )
}

// ── 생성기 본체 ─────────────────────────────────────────────

interface Frame {
  dataUrl: string
  frame_type: 'first_frame' | 'last_frame'
  name: string
}

function Generator({
  apiKey,
  onLock,
  onForget,
}: {
  apiKey: string
  onLock: () => void
  onForget: () => void
}) {
  const [models, setModels] = useState<VideoModel[] | null>(null)
  const [modelsErr, setModelsErr] = useState('')
  const [modelId, setModelId] = useState('')

  const [prompt, setPrompt] = useState('')
  const [frames, setFrames] = useState<Frame[]>([])
  const [duration, setDuration] = useState<number | ''>('')
  const [resolution, setResolution] = useState('')
  const [aspect, setAspect] = useState('')
  const [audio, setAudio] = useState(false)

  const [running, setRunning] = useState(false)
  const [statusText, setStatusText] = useState('')
  const [genErr, setGenErr] = useState('')
  const [videoUrl, setVideoUrl] = useState<string | null>(null)
  const [cost, setCost] = useState<number | null>(null)
  const [savedVideo, setSavedVideo] = useState<StoredVideo | null>(null)
  const abortRef = useRef<AbortController | null>(null)
  const blobUrlRef = useRef<string | null>(null)

  const [library, setLibrary] = useState<StoredVideo[]>([])
  const [dpRows, setDpRows] = useState<DpRow[]>([])
  const reloadLibrary = useCallback(() => {
    listVideos().then(setLibrary).catch(() => {})
  }, [])
  useEffect(() => {
    reloadLibrary()
    api.listDetailPages().then((r) => setDpRows(r as DpRow[])).catch(() => {})
  }, [reloadLibrary])

  useEffect(() => {
    let alive = true
    listVideoModels(apiKey)
      .then((list) => {
        if (!alive) return
        const sorted = [...list].sort((a, b) => a.name.localeCompare(b.name))
        setModels(sorted)
        if (sorted[0]) setModelId(sorted[0].id)
      })
      .catch((e) => alive && setModelsErr((e as Error).message))
    return () => {
      alive = false
    }
  }, [apiKey])

  const model = useMemo(() => models?.find((m) => m.id === modelId), [models, modelId])

  // 모델이 바뀌면 지원값 기본 선택
  useEffect(() => {
    if (!model) return
    setDuration(model.supported_durations?.[0] ?? '')
    setResolution(model.supported_resolutions?.[0] ?? '')
    setAspect(model.supported_aspect_ratios?.[0] ?? '')
  }, [model])

  useEffect(() => {
    return () => {
      if (blobUrlRef.current) URL.revokeObjectURL(blobUrlRef.current)
      abortRef.current?.abort()
    }
  }, [])

  const est = useMemo(
    () => (model ? estimateCost(model, typeof duration === 'number' ? duration : undefined, resolution) : null),
    [model, duration, resolution],
  )

  async function addFrame(file: File, frame_type: Frame['frame_type']) {
    try {
      const dataUrl = await fileToDataUrl(file)
      setFrames((f) => [...f.filter((x) => x.frame_type !== frame_type), { dataUrl, frame_type, name: file.name }])
    } catch (e) {
      setGenErr((e as Error).message)
    }
  }

  const generate = useCallback(async () => {
    if (!model) return
    if (!prompt.trim() && frames.length === 0) {
      setGenErr('프롬프트 또는 시작 이미지를 넣어주세요.')
      return
    }
    setGenErr('')
    setRunning(true)
    setStatusText('작업 제출 중...')
    setVideoUrl(null)
    setCost(null)
    setSavedVideo(null)
    if (blobUrlRef.current) {
      URL.revokeObjectURL(blobUrlRef.current)
      blobUrlRef.current = null
    }
    const ac = new AbortController()
    abortRef.current = ac

    try {
      const frame_images: FrameImage[] = frames.map((f) => ({
        type: 'image_url',
        image_url: { url: f.dataUrl },
        frame_type: f.frame_type,
      }))
      const job = await createVideoJob(apiKey, {
        model: model.id,
        prompt: prompt.trim(),
        duration: typeof duration === 'number' ? duration : undefined,
        resolution: resolution || undefined,
        aspect_ratio: aspect || undefined,
        generate_audio: audio || undefined,
        frame_images: frame_images.length ? frame_images : undefined,
      })
      setStatusText(`대기열 등록됨 (${job.id}). 생성 대기 중...`)

      const done = await pollUntilDone(apiKey, job.id, {
        signal: ac.signal,
        onTick: (j) => setStatusText(`상태: ${j.status} ...`),
      })

      if (done.status !== 'completed') throw new Error(jobErrorMessage(done))

      setStatusText('영상 내려받는 중...')
      const blob = await fetchVideoBlob(apiKey, done)
      const url = URL.createObjectURL(blob)
      blobUrlRef.current = url
      setVideoUrl(url)
      setCost(done.usage?.cost ?? null)

      // 새로고침해도 사라지지 않도록 즉시 브라우저(IndexedDB)에 보관
      setStatusText('브라우저에 저장 중...')
      try {
        const rec = await saveVideo({
          blob,
          mime: blob.type || 'video/mp4',
          model: model.id,
          prompt: prompt.trim(),
          cost: done.usage?.cost,
        })
        setSavedVideo(rec)
        reloadLibrary()
      } catch {
        setGenErr('영상은 만들어졌지만 브라우저 저장에 실패했어요. 아래에서 바로 다운로드하세요.')
      }
      setStatusText('완료')
    } catch (e) {
      setGenErr((e as Error).message)
      setStatusText('')
    } finally {
      setRunning(false)
      abortRef.current = null
    }
  }, [apiKey, model, prompt, frames, duration, resolution, aspect, audio, reloadLibrary])

  return (
    <div className="stack" style={{ gap: 18 }}>
      <div className="card card-pad row" style={{ justifyContent: 'space-between', flexWrap: 'wrap', gap: 10 }}>
        <span className="muted" style={{ fontSize: 13 }}>
          🔓 키 잠금 해제됨 (이 세션 메모리에만 있음)
        </span>
        <div className="row" style={{ gap: 8 }}>
          <Button size="sm" variant="outline" onClick={onLock}>
            키 잠그기
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => {
              if (confirm('저장된 암호화 키를 삭제할까요?')) onForget()
            }}
          >
            키 삭제
          </Button>
        </div>
      </div>

      {modelsErr && (
        <Notice tone="danger">
          모델 목록을 불러오지 못했습니다. {modelsErr}
        </Notice>
      )}

      {!models && !modelsErr && <Loading label="OpenRouter 비디오 모델 불러오는 중..." />}

      {models && (
        <>
          <div className="card card-pad stack" style={{ gap: 16 }}>
            <b style={{ fontSize: 16 }}>2) 모델 선택</b>
            {models.length === 0 ? (
              <Notice tone="warn">사용 가능한 비디오 모델이 없습니다.</Notice>
            ) : (
              <>
                <Field label="비디오 생성 모델">
                  <select className="select" value={modelId} onChange={(e) => setModelId(e.target.value)}>
                    {models.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.name} ({m.id})
                      </option>
                    ))}
                  </select>
                </Field>
                {model && (
                  <div className="review-card">
                    <dl>
                      <dt>가격</dt>
                      <dd>
                        {formatPricing(model).length
                          ? formatPricing(model).map((p) => <div key={p}>{p}</div>)
                          : '공개 정보 없음'}
                      </dd>
                      {model.supported_durations?.length ? (
                        <>
                          <dt>지원 길이</dt>
                          <dd>{model.supported_durations.join(', ')}초</dd>
                        </>
                      ) : null}
                      {model.supported_resolutions?.length ? (
                        <>
                          <dt>해상도</dt>
                          <dd>{model.supported_resolutions.join(', ')}</dd>
                        </>
                      ) : null}
                      {model.supported_aspect_ratios?.length ? (
                        <>
                          <dt>화면비</dt>
                          <dd>{model.supported_aspect_ratios.join(', ')}</dd>
                        </>
                      ) : null}
                    </dl>
                  </div>
                )}
              </>
            )}
          </div>

          <div className="card card-pad stack" style={{ gap: 16 }}>
            <b style={{ fontSize: 16 }}>3) 입력</b>
            <Field label="프롬프트 (텍스트)" hint="이미지만으로 생성 가능한 모델은 비워둘 수 있어요.">
              <textarea
                className="textarea"
                rows={4}
                placeholder="예: 아산 배 농장, 이른 아침 햇살, 이슬 맺힌 배를 클로즈업하며 천천히 줌아웃"
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
              />
            </Field>

            <div className="stack" style={{ gap: 10 }}>
              <label style={{ fontWeight: 700, fontSize: 13 }}>이미지 (선택) — 시작/끝 프레임</label>
              <div className="row" style={{ gap: 12, flexWrap: 'wrap' }}>
                {(['first_frame', 'last_frame'] as const).map((ft) => {
                  const f = frames.find((x) => x.frame_type === ft)
                  return (
                    <div key={ft} className="stack" style={{ gap: 6, width: 150 }}>
                      <span className="muted" style={{ fontSize: 12 }}>
                        {ft === 'first_frame' ? '시작 프레임' : '끝 프레임'}
                      </span>
                      {f ? (
                        <div style={{ position: 'relative' }}>
                          <img
                            src={f.dataUrl}
                            alt=""
                            style={{ width: '100%', borderRadius: 8, display: 'block' }}
                          />
                          <button
                            className="btn btn-ghost btn-sm"
                            style={{ marginTop: 4 }}
                            onClick={() => setFrames((arr) => arr.filter((x) => x.frame_type !== ft))}
                          >
                            제거
                          </button>
                        </div>
                      ) : (
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => {
                            const file = e.target.files?.[0]
                            if (file) addFrame(file, ft)
                            e.target.value = ''
                          }}
                        />
                      )}
                    </div>
                  )
                })}
              </div>
            </div>

            <div className="row" style={{ gap: 12, flexWrap: 'wrap' }}>
              {model?.supported_durations?.length ? (
                <div style={{ flex: 1, minWidth: 120 }}>
                  <Field label="길이(초)">
                    <select
                      className="select"
                      value={duration}
                      onChange={(e) => setDuration(e.target.value ? Number(e.target.value) : '')}
                    >
                      {model.supported_durations.map((d) => (
                        <option key={d} value={d}>
                          {d}초
                        </option>
                      ))}
                    </select>
                  </Field>
                </div>
              ) : null}
              {model?.supported_resolutions?.length ? (
                <div style={{ flex: 1, minWidth: 120 }}>
                  <Field label="해상도">
                    <select className="select" value={resolution} onChange={(e) => setResolution(e.target.value)}>
                      {model.supported_resolutions.map((r) => (
                        <option key={r} value={r}>
                          {r}
                        </option>
                      ))}
                    </select>
                  </Field>
                </div>
              ) : null}
              {model?.supported_aspect_ratios?.length ? (
                <div style={{ flex: 1, minWidth: 120 }}>
                  <Field label="화면비">
                    <select className="select" value={aspect} onChange={(e) => setAspect(e.target.value)}>
                      {model.supported_aspect_ratios.map((a) => (
                        <option key={a} value={a}>
                          {a}
                        </option>
                      ))}
                    </select>
                  </Field>
                </div>
              ) : null}
            </div>

            <label className="row" style={{ gap: 8, fontSize: 14 }}>
              <input type="checkbox" checked={audio} onChange={(e) => setAudio(e.target.checked)} />
              오디오도 생성 (지원 모델만)
            </label>

            {est !== null && (
              <Notice tone="info">
                예상 비용: 약 <b>${est.toFixed(3)}</b> (모델 가격 기준 추정치, 실제 청구액과 다를 수 있음)
              </Notice>
            )}

            {genErr && <Notice tone="danger">{genErr}</Notice>}

            <div className="row" style={{ gap: 10 }}>
              <Button onClick={generate} loading={running} disabled={!model}>
                🎬 영상 생성
              </Button>
              {running && (
                <Button
                  variant="ghost"
                  onClick={() => {
                    abortRef.current?.abort()
                    setRunning(false)
                    setStatusText('취소됨')
                  }}
                >
                  취소
                </Button>
              )}
              {statusText && <span className="muted" style={{ fontSize: 13 }}>{statusText}</span>}
            </div>
          </div>

          {videoUrl && (
            <div className="card card-pad stack" style={{ gap: 12 }}>
              <b style={{ fontSize: 16 }}>4) 결과</b>
              <video
                src={videoUrl}
                controls
                playsInline
                style={{ width: '100%', borderRadius: 12, background: '#000', maxHeight: 520 }}
              />
              <div className="row" style={{ gap: 10, flexWrap: 'wrap' }}>
                <a className="btn btn-primary" href={videoUrl} download={`youngfarm-video-${Date.now()}.mp4`}>
                  ⬇ 다운로드
                </a>
                {cost !== null && (
                  <span className="muted" style={{ fontSize: 13, alignSelf: 'center' }}>
                    청구 비용: ${cost.toFixed(4)}
                  </span>
                )}
              </div>
              {savedVideo ? (
                <Notice tone="ok">
                  ✅ 이 브라우저에 저장됐어요. 아래 "내가 만든 영상"에서 다시 볼 수 있고, 상세페이지에도 첨부할 수 있어요.
                </Notice>
              ) : (
                <Notice tone="warn">브라우저 저장 실패 — 지금 바로 다운로드해두세요.</Notice>
              )}
              {savedVideo && (
                <AttachPanel
                  video={savedVideo}
                  dpRows={dpRows}
                  onAttached={() => {
                    reloadLibrary()
                    api.listDetailPages().then((r) => setDpRows(r as DpRow[]))
                  }}
                />
              )}
            </div>
          )}

          <VideoLibrary
            videos={library}
            dpRows={dpRows}
            onChange={() => {
              reloadLibrary()
              api.listDetailPages().then((r) => setDpRows(r as DpRow[]))
            }}
          />
        </>
      )}
    </div>
  )
}

// ── 상세페이지 첨부 패널 ────────────────────────────────────

function AttachPanel({
  video,
  dpRows,
  onAttached,
}: {
  video: StoredVideo
  dpRows: DpRow[]
  onAttached: () => void
}) {
  const [productId, setProductId] = useState(dpRows[0]?.product?.id ?? '')
  const [label, setLabel] = useState(video.prompt.slice(0, 40) || '농장 소개 영상')
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState('')

  useEffect(() => {
    if (!productId && dpRows[0]?.product?.id) setProductId(dpRows[0].product.id)
  }, [dpRows, productId])

  if (dpRows.length === 0)
    return (
      <Notice tone="info">
        첨부할 상세페이지가 없어요. 농가 화면에서 상품의 <b>AI 상세페이지</b>를 먼저 만들어주세요.
      </Notice>
    )

  async function attach() {
    if (!productId) return
    setBusy(true)
    setMsg('')
    try {
      await updateVideoMeta(video.id, { productId, label })
      await api.attachDetailVideo(productId, {
        assetId: video.id,
        label,
        model: video.model,
        createdAt: video.createdAt,
      })
      const row = dpRows.find((r) => r.product?.id === productId)
      setMsg(`"${row?.product?.name ?? ''}" 상세페이지에 첨부됐어요.`)
      onAttached()
    } catch (e) {
      setMsg((e as Error).message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="stack" style={{ gap: 10, borderTop: '1px dashed var(--line-strong)', paddingTop: 12 }}>
      <b style={{ fontSize: 14 }}>상세페이지에 첨부</b>
      <Field label="첨부할 상세페이지">
        <select className="select" value={productId} onChange={(e) => setProductId(e.target.value)}>
          {dpRows.map((r) => (
            <option key={r.detailPage.id} value={r.product?.id}>
              {r.farm?.farmName} · {r.product?.name} — {r.detailPage.headline}
              {r.detailPage.status === 'published' ? '' : ' (초안)'}
            </option>
          ))}
        </select>
      </Field>
      <Field label="영상 이름">
        <input className="input" value={label} onChange={(e) => setLabel(e.target.value)} maxLength={40} />
      </Field>
      <div>
        <Button onClick={attach} loading={busy}>
          이 상세페이지에 첨부
        </Button>
      </div>
      {msg && <Notice tone="ok">{msg}</Notice>}
    </div>
  )
}

// ── 내가 만든 영상 (IndexedDB 라이브러리) ──────────────────

function VideoLibrary({
  videos,
  dpRows,
  onChange,
}: {
  videos: StoredVideo[]
  dpRows: DpRow[]
  onChange: () => void
}) {
  if (videos.length === 0) return null
  return (
    <div className="card card-pad stack" style={{ gap: 14 }}>
      <b style={{ fontSize: 16 }}>내가 만든 영상 ({videos.length})</b>
      <p className="muted" style={{ fontSize: 13 }}>
        이 브라우저에 저장돼 있어요. 새로고침해도 남습니다.
      </p>
      {videos.map((v) => (
        <div key={v.id} className="stack" style={{ gap: 8, borderTop: '1px solid var(--line)', paddingTop: 12 }}>
          <div className="muted" style={{ fontSize: 12 }}>
            {v.model} · {new Date(v.createdAt).toLocaleString('ko-KR')}
            {v.cost !== undefined ? ` · $${v.cost.toFixed(4)}` : ''}
          </div>
          <div style={{ fontSize: 13 }}>{v.label || v.prompt || '(프롬프트 없음)'}</div>
          <DetailVideoPlayer
            assetId={v.id}
            label={v.label || 'youngfarm-video'}
            onRemove={() => {
              if (confirm('이 영상을 브라우저에서 삭제할까요?')) deleteVideo(v.id).then(onChange)
            }}
          />
          <AttachPanel video={v} dpRows={dpRows} onAttached={onChange} />
        </div>
      ))}
    </div>
  )
}
