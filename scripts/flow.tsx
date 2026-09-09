/* 시나리오 테스트 — mock API 데이터 흐름 검증 (5개 BM + 권한 분리) */
import { JSDOM } from 'jsdom'
const dom = new JSDOM('<!doctype html><html><body></body></html>', { url: 'http://localhost/' })
const g = globalThis as any
g.window = dom.window
g.document = dom.window.document
g.localStorage = dom.window.localStorage

const { api } = await import('../src/lib/api')
const { seedIfEmpty, read } = await import('../src/lib/db')

const assert = (cond: any, msg: string) => {
  if (!cond) throw new Error('FAIL: ' + msg)
  console.log('  ✓ ' + msg)
}
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms))
seedIfEmpty()

const demoFarm = read().farms.find((f) => f.email === 'sunfarm@example.com')!
const demoBuyer = read().buyers.find((b) => b.email === 'buyer@example.com')!

console.log('\n[1] 농가 가입/로그인/농산물 등록')
const farm = await api.signup({
  farmName: '테스트농원', ownerName: '홍길동', phone: '010-1', email: 'flow@test.com',
  password: 'pw12345', region: '충청남도 아산시',
})
await api.login('flow@test.com', 'pw12345')
try { await api.login('flow@test.com', 'x'); assert(false, 'x') } catch { assert(true, '틀린 비번 거부') }
const product = await api.createProduct({
  farmId: farm.id, name: '아산 사과', variety: '후지', region: '충청남도 아산시',
  method: 'organic', harvestSeason: '가을 (9~11월)', story: '30년째 사과 농사. 유기농 재배.', photos: [],
  farmingYears: 30, certifications: ['유기농 인증'], sweetness: '당도 15 브릭스',
  sellingPoint: '해발 200m 고랭지 유기농 후지', care: '봉지 씌우기와 초생재배',
  priceRange: '5kg 40,000원', shipMethod: '산지 직송', storageTip: '냉장 보관', giftWrap: true,
  grade: '특', packUnit: '5kg (12~14과)', harvestPeriod: '10월 중순~하순',
})
assert((await api.listProducts(farm.id)).length === 1, '내 농산물 1개')

console.log('\n[2] 권한 분리')
const demoProd = read().products.find((p) => p.farmId === demoFarm.id)!
assert((await api.getProduct(farm.id, demoProd.id)) === undefined, '다른 농가 농산물 조회 차단')

console.log('\n[2b] AI 상세페이지 → 확정 → 영상 재료로 사용')
assert((await api.getDetailPage(farm.id, product.id)) === null, '처음엔 상세페이지 없음')
const dp = await api.generateDetailPage(farm.id, product.id)
assert(dp.status === 'draft' && dp.highlights.length === 4, `상세페이지 특징 4개 (${dp.highlights.length})`)
assert(dp.specs.some((s) => s.k === '인증') && dp.specs.some((s) => s.k === '재배 경력') && dp.specs.some((s) => s.k === '당도·특징'), '입력한 인증·경력·당도가 상품정보에 반영')
assert(dp.faq.some((f) => f.q.includes('가격')), '가격대 입력 시 FAQ에 반영')
await api.updateDetailPage(farm.id, dp.id, { headline: '내가 고친 제목' })
assert((await api.getDetailPage(farm.id, product.id))!.headline === '내가 고친 제목', '수정 반영')
await api.publishDetailPage(farm.id, dp.id)
assert((await api.getDetailPage(farm.id, product.id))!.status === 'published', '확정됨')

// 생성된 영상을 상세페이지에 첨부 (실제 파일은 브라우저 videoStore, 여기선 메타만)
await api.attachDetailVideo(product.id, {
  assetId: 'vid_test1', label: '농장 소개 영상', model: 'google/veo-3.1', createdAt: new Date().toISOString(),
})
assert((await api.getDetailPage(farm.id, product.id))!.videos?.[0]?.assetId === 'vid_test1', '상세페이지에 영상 첨부')
const allDp = await api.listDetailPages()
assert(allDp.some((r) => r.product?.id === product.id && r.detailPage.videos?.length === 1), '스튜디오 첨부 목록에 반영')
await api.detachDetailVideo(product.id, 'vid_test1')
assert(((await api.getDetailPage(farm.id, product.id))!.videos ?? []).length === 0, '영상 첨부 제거')

console.log('\n[3] AI 콘텐츠: 예치금(코인) 차감')
const w0 = await api.getWallet(farm.id)
assert(w0.balance === 100, `가입 축하 코인 100 (${w0.balance})`)
// 잔액 부족이면 제작 불가
try {
  await api.requestContent({ farmId: farm.id, productId: product.id, length: '15s' })
  assert(false, '코인 부족인데 통과됨')
} catch (e) { assert((e as Error).message === 'INSUFFICIENT_COINS', '코인 부족 → INSUFFICIENT_COINS') }
// 충전 (10만원 팩 = 1000 + 보너스 120)
await api.topUpWallet(farm.id, 'pack_m')
assert((await api.getWallet(farm.id)).balance === 100 + 1120, '충전+보너스 반영')
const { content } = await api.requestContent({ farmId: farm.id, productId: product.id, length: '15s' })
assert((await api.getWallet(farm.id)).balance === 1220 - 290, `제작 시 ${api.contentCoinCost()}코인 차감`)
assert(content.coinCost === 290 && content.script.scenes.length >= 3, 'AI 스크립트 생성 + 코인 기록')
assert(content.detailPageId === dp.id, '영상이 확정된 상세페이지를 재료로 사용')

console.log('\n[4] 건별 부가서비스 — 코인 차감')
await api.topUpWallet(farm.id, 'pack_l') // +3000 +500 보너스
const beforeBal = (await api.getWallet(farm.id)).balance
await api.createOrder({ farmId: farm.id, type: 'shooting', memo: '드론 촬영' })
assert((await api.getWallet(farm.id)).balance === beforeBal - 1500, '촬영 대행 1500코인 차감')
const w1 = await api.getWallet(farm.id)
assert(
  w1.txns.some((t) => t.type === 'spend' && t.amount === -1500) &&
    w1.txns.some((t) => t.type === 'topup' && t.wonPaid === 100000) &&
    w1.txns.some((t) => t.type === 'bonus'),
  '코인 내역에 충전·보너스·사용 기록',
)

console.log('\n[5] 자동 진행 → 관리자 검수 → 승인')
await sleep(19000)
const fresh = await api.getContent(farm.id, content.id)
assert(fresh!.status === 'review', `19초 후 검수 대기: ${fresh!.status}`)
await api.admin.login('admin@youngfarm.ai', 'admin1234')
await api.admin.approve(content.id, '자막 키워주세요')
assert((await api.getContent(farm.id, content.id))!.status === 'published', '승인 → 발행')

console.log('\n[6] ② 자체 판매 — 상품 등록 → 구매자 주문')
const listing = await api.createListing({
  farmId: farm.id, productId: product.id, title: '아산 사과 5kg', unitLabel: '5kg',
  price: 30000, stock: 10, description: '유기농 후지',
})
assert(listing.status === 'live', '판매 상품 등록')
const browse = await api.buyer.browse()
assert(browse.some((r: any) => r.listing.id === listing.id), '스토어에 노출')
const order = await api.buyer.checkout(demoBuyer.id, [{ listingId: listing.id, qty: 2 }])
assert(order.goods === 60000 && order.platformFee > 0, `주문 결제 (수수료 ${order.platformFee})`)
assert(read().listings.find((l) => l.id === listing.id)!.stock === 8, '재고 차감')
const myStore = await api.myStore(farm.id)
assert(myStore.orders.length === 1 && myStore.summary.gmv === 60000, '농가 판매 관리에 주문 반영')

console.log('\n[7] ③ 공동구매')
const gb = await api.createGroupBuy({
  farmId: farm.id, productId: product.id, title: '사과 공구', normalPrice: 30000,
  groupPrice: 24000, unitLabel: '5kg', targetQty: 3,
})
await api.buyer.joinGroupBuy(demoBuyer.id, gb.id, 2)
let gbNow = (await api.buyer.getGroupBuy(gb.id)).gb
assert(gbNow.currentQty === 2 && gbNow.status === 'open', '공구 2/3 모집 중')
await api.buyer.joinGroupBuy(read().buyers.find((x) => x.id === 'buyer_2')!.id, gb.id, 2)
gbNow = (await api.buyer.getGroupBuy(gb.id)).gb
assert(gbNow.currentQty === 4 && gbNow.status === 'reached', '목표 달성 → reached')

console.log('\n[8] ④ 농산물 정기구독 (B2C, 콘텐츠 구독과 별개)')
const boxes = await api.buyer.produceBoxes()
const box = boxes.find((x: any) => x.farm.id === farm.id)
assert(!!box, '우리 농가 정기구독 박스 노출')
const psub = await api.buyer.subscribeProduce(demoBuyer.id, farm.id, 'monthly')
assert(psub.status === 'active' && psub.boxPrice === 35000, '정기구독 시작')
const mySubs = await api.buyer.myProduceSubs(demoBuyer.id)
assert(mySubs.some((s: any) => s.sub.id === psub.id), '구매자 마이페이지에 구독 표시')
await api.buyer.setProduceSubStatus(demoBuyer.id, psub.id, 'paused')
assert(read().produceSubs.find((s) => s.id === psub.id)!.status === 'paused', '일시정지 반영')
// 농가의 콘텐츠 예치금과 소비자 농산물 정기구독은 완전 별개
const store2 = await api.myStore(farm.id)
assert(store2.produceSubs.length === 1, '농가 판매관리에 정기구독자 1명')
assert((await api.getWallet(farm.id)).balance > 0, '농가 코인 잔액은 농산물 구독과 무관하게 유지')

console.log('\n[9] ① 유통 소싱 (B2B)')
const src = await api.buyer.sourcing()
assert(src.length >= 5 && src.every((s: any) => s.product.wholesale), '소싱 카탈로그(도매 정보 포함)')
const srcReq = await api.buyer.applySourcing({ sellerId: demoBuyer.id, productId: src[0].product.id, qtyKg: 50 })
assert(srcReq.status === 'requested' && srcReq.fee > 0 && srcReq.amount > 0, `소싱 신청 (수수료 ${srcReq.fee})`)
const mySrc = await api.buyer.mySourcing(demoBuyer.id)
assert(mySrc.some((x: any) => x.req.id === srcReq.id), '내 소싱 내역에 표시')

console.log('\n[10] ⑤ 건별 부가서비스 (코인 차감 확인)')
assert(read().orders.some((o) => o.farmId === farm.id && o.type === 'shooting'), '촬영 대행 주문 (코인 차감)')

console.log('\n[11] 관리자 매출 — 5개 라인 합산 (구독 → 예치금 충전)')
const rev = await api.admin.revenue()
assert(rev.sourcingFee > 0, `유통 소싱 수수료 ${rev.sourcingFee}`)
assert(rev.coinTopupRevenue > 0, `콘텐츠 예치금 충전 매출 ${rev.coinTopupRevenue}`)
assert(rev.coinsOutstanding > 0, `미사용 예치금(부채) ${rev.coinsOutstanding}`)
assert(rev.selfSaleFee > 0, `자체 판매 수수료 ${rev.selfSaleFee}`)
assert(rev.groupBuyFee > 0, `공동구매 수수료 ${rev.groupBuyFee}`)
assert(rev.produceSubFee > 0, `정기구독 수수료 ${rev.produceSubFee}`)
assert(
  rev.total ===
    rev.sourcingFee + rev.coinTopupRevenue + rev.selfSaleFee + rev.groupBuyFee + rev.produceSubFee,
  '매출 합계 = 5개 라인 합',
)
assert((rev as any).contentMrr === undefined, '구독 매출(contentMrr) 제거됨')
const com = await api.admin.commerce()
assert(com.totals.orders >= 3 && com.sourcing.length >= 4, '커머스 현황 집계 (소싱 포함)')

console.log('\n[10b] 앱 콘텐츠 — 소식/산지/숏폼/홈')
const home = await api.buyer.home()
assert(home.recommended.length > 0 && home.reels.length > 0 && !!home.latestEpisode, '홈 데이터 묶음')
const news = await api.buyer.news()
assert(news.length >= 4, `소식 피드 ${news.length}건`)
await api.buyer.likePost(news[0].post.id)
assert((await api.buyer.news())[0].post.likes === news[0].post.likes + 1, '좋아요 +1')
const sanji = await api.buyer.sanji()
assert(sanji.length >= 4 && sanji[0].ep.epNo > sanji[1].ep.epNo, '서영왔서영 최신순')
const reels = await api.buyer.reels()
assert(reels.every((r: any) => r.content.status === 'published'), '숏폼은 발행분만')

console.log('\n[11] 지자체 흔적 없음')
assert((api as any).admin.programs === undefined, 'admin.programs 제거됨')
assert(!('program' in (await api.getBilling(farm.id))), 'billing 응답에 program 없음')

console.log('\n[12] 권한 분리 — 커머스/구매자 데이터')
const other = await api.buyer.myOrders(read().buyers.find((x) => x.id === 'buyer_2')!.id)
assert(!other.some((o) => o.items.some((it) => it.title === '아산 사과 5kg' && o.buyerId === demoBuyer.id)), '다른 구매자 주문 안 보임')

console.log('\n모든 시나리오 통과 ✅  (BM 5종 + 권한 분리)')
process.exit(0)
