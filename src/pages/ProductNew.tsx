import { useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from '../lib/api'
import { useAuth } from '../lib/auth'
import { fileToDataUrl } from '../lib/image'
import type { CultivationMethod } from '../lib/types'
import { CERT_OPTIONS, CULTIVATION_LABEL } from '../lib/types'
import { Button, Field, Notice, Steps, VideoThumb } from '../components/ui'

const STEP_LABELS = ['기본정보', '재배정보', '농가 이야기', '판매·배송', '사진', '확인']
const MAX_PHOTOS = 10
const HARVEST_OPTIONS = ['봄 (3~5월)', '여름 (6~8월)', '가을 (9~11월)', '겨울 (12~2월)', '연중']

interface Form {
  name: string
  variety: string
  region: string
  grade: string
  packUnit: string
  method: CultivationMethod
  farmingYears: string
  certifications: string[]
  harvestSeason: string
  harvestPeriod: string
  sweetness: string
  sellingPoint: string
  care: string
  story: string
  priceRange: string
  shipMethod: string
  storageTip: string
  giftWrap: boolean
  photos: string[]
}

export default function ProductNew() {
  const navigate = useNavigate()
  const { farm } = useAuth()
  const [step, setStep] = useState(0)
  const [form, setForm] = useState<Form>({
    name: '', variety: '', region: farm?.region ?? '', grade: '', packUnit: '',
    method: 'eco', farmingYears: '', certifications: [], harvestSeason: '가을 (9~11월)',
    harvestPeriod: '', sweetness: '', sellingPoint: '', care: '', story: '',
    priceRange: '', shipMethod: '', storageTip: '', giftWrap: false, photos: [],
  })
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const set = <K extends keyof Form>(k: K, v: Form[K]) => setForm((f) => ({ ...f, [k]: v }))
  const toggleCert = (c: string) =>
    setForm((f) => ({
      ...f,
      certifications: f.certifications.includes(c)
        ? f.certifications.filter((x) => x !== c)
        : [...f.certifications, c],
    }))

  function next() {
    setError('')
    if (step === 0 && !form.name.trim()) return setError('농산물명을 입력해 주세요.')
    if (step === 0 && !form.region.trim()) return setError('생산 지역을 입력해 주세요.')
    if (step === 2 && form.story.trim().length < 10)
      return setError('농가 이야기를 10자 이상 적어주세요. AI가 콘텐츠를 만드는 데 꼭 필요해요.')
    setStep((s) => Math.min(s + 1, STEP_LABELS.length - 1))
  }
  function prev() {
    setError('')
    setStep((s) => Math.max(s - 1, 0))
  }

  async function submit() {
    if (!farm) return
    setSubmitting(true)
    setError('')
    try {
      const t = (s: string) => s.trim() || undefined
      const product = await api.createProduct({
        farmId: farm.id,
        name: form.name.trim(),
        variety: form.variety.trim(),
        region: form.region.trim(),
        method: form.method,
        harvestSeason: form.harvestSeason,
        story: form.story.trim(),
        photos: form.photos,
        grade: t(form.grade),
        packUnit: t(form.packUnit),
        farmingYears: form.farmingYears ? Number(form.farmingYears) : undefined,
        certifications: form.certifications.length ? form.certifications : undefined,
        sweetness: t(form.sweetness),
        harvestPeriod: t(form.harvestPeriod),
        sellingPoint: t(form.sellingPoint),
        care: t(form.care),
        priceRange: t(form.priceRange),
        shipMethod: t(form.shipMethod),
        storageTip: t(form.storageTip),
        giftWrap: form.giftWrap || undefined,
      })
      navigate(`/products/${product.id}/detail`, { replace: true, state: { justCreated: true } })
    } catch (e) {
      setError((e as Error).message)
      setSubmitting(false)
    }
  }

  const filled = countFilled(form)

  return (
    <div className="page">
      <div className="container" style={{ maxWidth: 720 }}>
        <h1 className="section-title" style={{ fontSize: 22 }}>농산물 등록</h1>
        <p className="section-sub">
          입력이 자세할수록 AI 상세페이지·영상 품질이 올라갑니다. (별표 외에는 선택)
        </p>

        <Steps steps={STEP_LABELS} current={step} />

        <div className="card card-pad stack" style={{ gap: 18 }}>
          {error && <Notice tone="danger">{error}</Notice>}

          {step === 0 && (
            <>
              <h2 style={{ fontSize: 18 }}>STEP 1. 기본정보</h2>
              <Field label="농산물명" required hint="예: 아산 배, 아산 햅쌀">
                <input className="input" placeholder="농산물 이름" value={form.name}
                  onChange={(e) => set('name', e.target.value)} autoFocus />
              </Field>
              <div className="form-grid-2">
                <Field label="품종" hint="예: 신고, 삼광, 후지">
                  <input className="input" placeholder="품종" value={form.variety}
                    onChange={(e) => set('variety', e.target.value)} />
                </Field>
                <Field label="등급·규격" hint="예: 특·상 / 대과">
                  <input className="input" placeholder="선택" value={form.grade}
                    onChange={(e) => set('grade', e.target.value)} />
                </Field>
              </div>
              <Field label="생산 지역" required hint="예: 충남 아산시 둔포면">
                <input className="input" placeholder="재배 지역" value={form.region}
                  onChange={(e) => set('region', e.target.value)} />
              </Field>
              <Field label="판매 포장 단위" hint="예: 5kg 박스 (9~11과), 10개입">
                <input className="input" placeholder="어떻게 포장해서 파나요?" value={form.packUnit}
                  onChange={(e) => set('packUnit', e.target.value)} />
              </Field>
            </>
          )}

          {step === 1 && (
            <>
              <h2 style={{ fontSize: 18 }}>STEP 2. 재배정보</h2>
              <Field label="재배방식" required>
                <div className="choice-group">
                  {(Object.keys(CULTIVATION_LABEL) as CultivationMethod[]).map((m) => (
                    <button type="button" key={m}
                      className={`choice ${form.method === m ? 'selected' : ''}`}
                      onClick={() => set('method', m)}>
                      {CULTIVATION_LABEL[m]}
                    </button>
                  ))}
                </div>
              </Field>
              <Field label="인증" hint="받으신 인증을 모두 선택하세요.">
                <div className="choice-group">
                  {CERT_OPTIONS.map((c) => (
                    <button type="button" key={c}
                      className={`choice ${form.certifications.includes(c) ? 'selected' : ''}`}
                      onClick={() => toggleCert(c)}>
                      {c}
                    </button>
                  ))}
                </div>
              </Field>
              <div className="form-grid-2">
                <Field label="재배 경력 (년)" hint="예: 20">
                  <input className="input" inputMode="numeric" placeholder="년수" value={form.farmingYears}
                    onChange={(e) => set('farmingYears', e.target.value.replace(/[^0-9]/g, ''))} />
                </Field>
                <Field label="당도·특징 수치" hint="예: 당도 12~14 브릭스">
                  <input className="input" placeholder="측정값이 있으면" value={form.sweetness}
                    onChange={(e) => set('sweetness', e.target.value)} />
                </Field>
              </div>
              <Field label="수확시기(계절)" required>
                <div className="choice-group">
                  {HARVEST_OPTIONS.map((h) => (
                    <button type="button" key={h}
                      className={`choice ${form.harvestSeason === h ? 'selected' : ''}`}
                      onClick={() => set('harvestSeason', h)}>
                      {h}
                    </button>
                  ))}
                </div>
              </Field>
              <Field label="구체적인 수확 시기" hint="예: 9월 중순 ~ 10월 초">
                <input className="input" placeholder="언제 수확하나요?" value={form.harvestPeriod}
                  onChange={(e) => set('harvestPeriod', e.target.value)} />
              </Field>
            </>
          )}

          {step === 2 && (
            <>
              <h2 style={{ fontSize: 18 }}>STEP 3. 농가 이야기</h2>
              <Field label="우리 농산물만의 강점 (한 줄)" hint="예: 일교차 큰 아산 땅에서 봉지 씌워 키운 신고배">
                <input className="input" placeholder="가장 내세우고 싶은 한 가지" value={form.sellingPoint}
                  onChange={(e) => set('sellingPoint', e.target.value)} />
              </Field>
              <Field label="재배할 때 특별히 신경 쓰는 점" hint="예: 한 알 한 알 봉지 씌우기, 물 관리">
                <input className="input" placeholder="정성 들이는 부분" value={form.care}
                  onChange={(e) => set('care', e.target.value)} />
              </Field>
              <Field label="농가 이야기" required
                hint="몇 년째 농사를 짓는지, 어떻게 시작했는지, 손님들 반응 등 자유롭게.">
                <textarea className="textarea" style={{ minHeight: 170 }}
                  placeholder="편하게 말하듯 적어주세요."
                  value={form.story} onChange={(e) => set('story', e.target.value)} />
              </Field>
              <p className="muted" style={{ fontSize: 13, marginTop: -6 }}>{form.story.trim().length}자</p>
            </>
          )}

          {step === 3 && (
            <>
              <h2 style={{ fontSize: 18 }}>STEP 4. 판매·배송</h2>
              <div className="form-grid-2">
                <Field label="판매 가격대" hint="예: 5kg 45,000원대">
                  <input className="input" placeholder="대략 얼마에 파나요?" value={form.priceRange}
                    onChange={(e) => set('priceRange', e.target.value)} />
                </Field>
                <Field label="배송 방법" hint="예: 주문 후 1~2일 내 산지 직송">
                  <input className="input" placeholder="어떻게 보내나요?" value={form.shipMethod}
                    onChange={(e) => set('shipMethod', e.target.value)} />
                </Field>
              </div>
              <Field label="농가가 추천하는 보관법" hint="예: 냉장 보관, 신문지에 싸서">
                <input className="input" placeholder="어떻게 보관하면 좋나요?" value={form.storageTip}
                  onChange={(e) => set('storageTip', e.target.value)} />
              </Field>
              <label className="check">
                <input type="checkbox" checked={form.giftWrap}
                  onChange={(e) => set('giftWrap', e.target.checked)} />
                <span>선물용 포장이 가능합니다</span>
              </label>
            </>
          )}

          {step === 4 && (
            <>
              <h2 style={{ fontSize: 18 }}>STEP 5. 사진</h2>
              <PhotoUploader photos={form.photos} onChange={(photos) => set('photos', photos)} onError={setError} />
              <Notice tone="info">사진이 있으면 상세페이지·영상 완성도가 훨씬 높아집니다.</Notice>
            </>
          )}

          {step === 5 && (
            <>
              <h2 style={{ fontSize: 18 }}>STEP 6. 확인</h2>
              <p className="muted" style={{ marginTop: -6 }}>입력한 내용을 확인하고 등록해주세요.</p>
              <div className="card review-card" style={{ padding: 20, background: 'var(--bg-soft)' }}>
                <dl>
                  <Row k="농산물명" v={form.name} />
                  <Row k="품종·등급" v={[form.variety, form.grade].filter(Boolean).join(' · ')} />
                  <Row k="생산 지역" v={form.region} />
                  <Row k="포장 단위" v={form.packUnit} />
                  <Row k="재배방식" v={CULTIVATION_LABEL[form.method]} />
                  <Row k="인증" v={form.certifications.join(', ')} />
                  <Row k="재배 경력" v={form.farmingYears ? `${form.farmingYears}년` : ''} />
                  <Row k="당도·특징" v={form.sweetness} />
                  <Row k="수확 시기" v={[form.harvestSeason, form.harvestPeriod].filter(Boolean).join(' / ')} />
                  <Row k="강점 한 줄" v={form.sellingPoint} />
                  <Row k="신경 쓰는 점" v={form.care} />
                  <Row k="농가 이야기" v={form.story} pre />
                  <Row k="가격대·배송" v={[form.priceRange, form.shipMethod].filter(Boolean).join(' · ')} />
                  <Row k="보관법" v={form.storageTip} />
                  <Row k="선물 포장" v={form.giftWrap ? '가능' : ''} />
                  <Row k="사진" v={`${form.photos.length}장`} />
                </dl>
              </div>
              {form.photos.length > 0 && (
                <div className="photo-grid">
                  {form.photos.map((p, i) => (
                    <div className="ph" key={i}><img src={p} alt={`사진 ${i + 1}`} /></div>
                  ))}
                </div>
              )}
            </>
          )}

          <div className="spread" style={{ marginTop: 8 }}>
            {step > 0 ? (
              <Button variant="ghost" onClick={prev} disabled={submitting}>← 이전</Button>
            ) : (
              <span />
            )}
            {step < STEP_LABELS.length - 1 ? (
              <Button onClick={next}>다음 →</Button>
            ) : (
              <Button variant="primary" size="lg" onClick={submit} loading={submitting}>
                농산물 등록하기
              </Button>
            )}
          </div>
        </div>

        {step < 5 && (
          <div className="card card-pad" style={{ marginTop: 20 }}>
            <div className="row" style={{ alignItems: 'flex-start', gap: 16 }}>
              <div style={{ width: 100, flexShrink: 0 }}>
                <VideoThumb productName={form.name || '농산물'} caption={form.name || '콘텐츠 미리보기'}
                  length="15초" photo={form.photos[0]} showPlay={false} />
              </div>
              <div>
                <b>입력한 항목 {filled}개</b>
                <p className="muted" style={{ fontSize: 14, marginTop: 4 }}>
                  등록 직후 이 정보로 AI가 상세페이지를 만들어드립니다. 항목이 많을수록 상세페이지·영상이
                  구체적이고 신뢰감 있게 나옵니다.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

function Row({ k, v, pre }: { k: string; v: string; pre?: boolean }) {
  return (
    <>
      <dt>{k}</dt>
      <dd style={pre ? { whiteSpace: 'pre-wrap', fontWeight: 400 } : undefined}>
        {v || <span className="muted">입력 안 함</span>}
      </dd>
    </>
  )
}

function countFilled(f: Form): number {
  let n = 0
  const keys: (keyof Form)[] = [
    'name', 'variety', 'region', 'grade', 'packUnit', 'method', 'farmingYears', 'sweetness',
    'harvestSeason', 'harvestPeriod', 'sellingPoint', 'care', 'story', 'priceRange', 'shipMethod', 'storageTip',
  ]
  for (const k of keys) if (String(f[k] ?? '').trim()) n++
  if (f.certifications.length) n++
  if (f.giftWrap) n++
  if (f.photos.length) n++
  return n
}

// ── 사진 업로더 ─────────────────────────────────────────────

function PhotoUploader({
  photos,
  onChange,
  onError,
}: {
  photos: string[]
  onChange: (photos: string[]) => void
  onError: (msg: string) => void
}) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [drag, setDrag] = useState(false)
  const [busy, setBusy] = useState(false)

  async function addFiles(files: FileList | null) {
    if (!files || files.length === 0) return
    onError('')
    const room = MAX_PHOTOS - photos.length
    if (room <= 0) {
      onError(`사진은 최대 ${MAX_PHOTOS}장까지 올릴 수 있어요.`)
      return
    }
    setBusy(true)
    const picked = Array.from(files).slice(0, room)
    const results: string[] = []
    for (const file of picked) {
      try {
        results.push(await fileToDataUrl(file))
      } catch (e) {
        onError((e as Error).message)
      }
    }
    onChange([...photos, ...results])
    setBusy(false)
  }

  return (
    <div>
      <div
        className={`dropzone ${drag ? 'drag' : ''}`}
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => {
          e.preventDefault()
          setDrag(true)
        }}
        onDragLeave={() => setDrag(false)}
        onDrop={(e) => {
          e.preventDefault()
          setDrag(false)
          addFiles(e.dataTransfer.files)
        }}
      >
        <div className="dz-emoji">{busy ? '⏳' : '📷'}</div>
        <div className="dz-title">{busy ? '사진을 불러오는 중...' : '농산물 사진을 올려주세요'}</div>
        <div className="dz-sub">
          이 영역을 클릭하거나 사진을 끌어다 놓으세요 · 최대 {MAX_PHOTOS}장 ({photos.length}/{MAX_PHOTOS})
        </div>
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          multiple
          hidden
          onChange={(e) => {
            addFiles(e.target.files)
            e.target.value = ''
          }}
        />
      </div>

      {photos.length > 0 && (
        <div className="photo-grid" style={{ marginTop: 14 }}>
          {photos.map((p, i) => (
            <div className="ph" key={i}>
              <img src={p} alt={`사진 ${i + 1}`} />
              <button type="button" onClick={() => onChange(photos.filter((_, idx) => idx !== i))} aria-label="사진 삭제">
                ✕
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
