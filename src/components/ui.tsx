import type { ButtonHTMLAttributes, ReactNode } from 'react'
import { Link } from 'react-router-dom'
import type { ContentStatus } from '../lib/types'
import { STATUS_LABEL } from '../lib/types'
import type { CSSProperties } from 'react'
import { produceArt, produceImage } from '../lib/produceArt'

export { produceArt, produceImage }

/** 농산물 이미지 (사진 있으면 사진, 없으면 일러스트) — 컨테이너를 꽉 채움 */
export function Art({
  name,
  photos,
  className,
  style,
}: {
  name: string
  photos?: string[]
  className?: string
  style?: CSSProperties
}) {
  return (
    <img
      src={produceImage(name, photos)}
      alt=""
      className={`art-cover ${className ?? ''}`}
      style={style}
    />
  )
}

// ── 버튼 ────────────────────────────────────────────────────

type Variant = 'primary' | 'amber' | 'outline' | 'ghost'
type Size = 'sm' | 'md' | 'lg'

interface BtnBase {
  variant?: Variant
  size?: Size
  block?: boolean
  loading?: boolean
  children: ReactNode
}

function classes(variant: Variant = 'primary', size: Size = 'md', block?: boolean) {
  return [
    'btn',
    `btn-${variant}`,
    size === 'lg' ? 'btn-lg' : size === 'sm' ? 'btn-sm' : '',
    block ? 'btn-block' : '',
  ]
    .filter(Boolean)
    .join(' ')
}

export function Button({
  variant,
  size,
  block,
  loading,
  children,
  disabled,
  ...rest
}: BtnBase & ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button className={classes(variant, size, block)} disabled={disabled || loading} {...rest}>
      {loading && <span className="spinner" />}
      {children}
    </button>
  )
}

export function LinkButton({
  to,
  variant,
  size,
  block,
  children,
  onClick,
}: BtnBase & { to: string; onClick?: () => void }) {
  return (
    <Link to={to} className={classes(variant, size, block)} onClick={onClick}>
      {children}
    </Link>
  )
}

// ── 배지 ────────────────────────────────────────────────────

const STATUS_TONE: Record<ContentStatus, string> = {
  requested: 'badge-neutral',
  analyzing: 'badge-info badge-pulse',
  scripting: 'badge-info badge-pulse',
  producing: 'badge-info badge-pulse',
  review: 'badge-warn badge-pulse',
  published: 'badge-ok',
  rejected: 'badge-danger',
}

export function StatusBadge({ status }: { status: ContentStatus }) {
  return (
    <span className={`badge ${STATUS_TONE[status]}`}>
      <span className="dot" />
      {STATUS_LABEL[status]}
    </span>
  )
}

// ── 입력 필드 ───────────────────────────────────────────────

interface FieldProps {
  label: string
  required?: boolean
  hint?: string
  error?: string
  children: ReactNode
}

export function Field({ label, required, hint, error, children }: FieldProps) {
  return (
    <div className="field">
      <label>
        {label}
        {required && <span className="req">*</span>}
      </label>
      {hint && <span className="hint">{hint}</span>}
      {children}
      {error && <span className="field-error">{error}</span>}
    </div>
  )
}

// ── 알림 박스 ───────────────────────────────────────────────

export function Notice({
  tone = 'info',
  icon,
  children,
}: {
  tone?: 'info' | 'warn' | 'ok' | 'danger'
  icon?: string
  children: ReactNode
}) {
  const defaultIcon = { info: 'ℹ️', warn: '⚠️', ok: '✅', danger: '🚫' }[tone]
  return (
    <div className={`notice notice-${tone}`}>
      <span className="ico">{icon ?? defaultIcon}</span>
      <div>{children}</div>
    </div>
  )
}

// ── 영상 썸네일 / 플레이스홀더 ─────────────────────────────

const PRODUCT_EMOJI: Record<string, string> = {
  배: '🍐',
  쌀: '🍚',
  사과: '🍎',
  포도: '🍇',
  딸기: '🍓',
  감: '🟠',
  토마토: '🍅',
  참외: '🍈',
  복숭아: '🍑',
  고구마: '🍠',
  감귤: '🍊',
  귤: '🍊',
  블루베리: '🫐',
}

export function productEmoji(name: string) {
  for (const key of Object.keys(PRODUCT_EMOJI)) {
    if (name.includes(key)) return PRODUCT_EMOJI[key]
  }
  return '🌾'
}

export function VideoThumb({
  productName,
  caption,
  length,
  photo,
  wide,
  showPlay = true,
}: {
  productName: string
  caption?: string
  length?: string
  photo?: string
  wide?: boolean
  showPlay?: boolean
}) {
  return (
    <div className={`video-thumb ${wide ? 'wide' : ''}`}>
      <img src={produceImage(productName, photo ? [photo] : undefined)} alt="" />
      {showPlay && <div className="play" />}
      {length && <span className="len">{length}</span>}
      {caption && <span className="cap">{caption}</span>}
    </div>
  )
}

// ── 스텝 표시 ───────────────────────────────────────────────

export function Steps({ steps, current }: { steps: string[]; current: number }) {
  return (
    <div className="steps">
      {steps.map((s, i) => {
        const state = i < current ? 'done' : i === current ? 'active' : ''
        return (
          <div key={s} className={`step-pill ${state}`}>
            <span className="n">{i < current ? '✓' : i + 1}</span>
            {s}
          </div>
        )
      })}
    </div>
  )
}

// ── 로딩 ────────────────────────────────────────────────────

export function Loading({ label = '불러오는 중...' }: { label?: string }) {
  return (
    <div className="loading-block">
      <span className="spinner dark" />
      {label}
    </div>
  )
}

// ── 빈 상태 ─────────────────────────────────────────────────

export function Empty({
  emoji = '🌱',
  title,
  desc,
  action,
}: {
  emoji?: string
  title: string
  desc?: string
  action?: ReactNode
}) {
  return (
    <div className="empty">
      <div className="e-emoji">{emoji}</div>
      <h3>{title}</h3>
      {desc && <p>{desc}</p>}
      {action}
    </div>
  )
}

// ── 프로토타입 안내 배지 ──────────────────────────────────

export function TempOptionTag() {
  return (
    <span className="badge badge-warn" title="PRD에서 아직 확정되지 않은 항목입니다">
      임시 옵션
    </span>
  )
}
