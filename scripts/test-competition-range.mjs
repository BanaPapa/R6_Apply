#!/usr/bin/env node
/**
 * odcloud 경쟁률 API(getAPTLttotPblancCmpet)가 2015~2019 house_manage_no에 대해
 * 데이터를 갖고 있는지 확인하는 테스트 스크립트.
 *
 * 사용:
 *   node --env-file=.env scripts/test-competition-range.mjs
 */
import axios from 'axios';
import { getSupabaseAdmin } from '../lib/supabase/serverClient.mjs';

const BASE = 'https://api.odcloud.kr/api';
const CMPET_SVC = 'ApplyhomeInfoCmpetRtSvc';
const getKey = () => process.env.ODCLOUD_SERVICE_KEY || '';

async function getCmpet(hmno) {
  const params = new URLSearchParams({
    page: '1', perPage: '5', serviceKey: getKey(),
    'cond[HOUSE_MANAGE_NO::EQ]': hmno,
  });
  const url = `${BASE}/${CMPET_SVC}/v1/getAPTLttotPblancCmpet?${params}`;
  const res = await axios.get(url, { timeout: 10000, validateStatus: () => true });
  if (res.status !== 200) return null;
  // matchCount = 필터 조건에 맞는 레코드 수 (totalCount 는 API 전체 레코드 수라 항상 크게 나옴)
  return { matchCount: res.data?.matchCount ?? 0, data: res.data?.data ?? [] };
}

(async () => {
  const sb = getSupabaseAdmin();
  if (!sb) { console.error('Supabase 미설정'); process.exit(1); }
  if (!getKey()) { console.error('ODCLOUD_SERVICE_KEY 미설정'); process.exit(1); }

  // Supabase에서 2015~2019 house_manage_no 샘플 10건 가져오기
  const { data: rows } = await sb
    .from('apply_announcements')
    .select('house_manage_no, house_name, notice_month')
    .lt('notice_month', '202001')
    .not('house_name', 'is', null)
    .order('notice_month', { ascending: true })
    .limit(15);

  console.log(`테스트 대상: ${rows?.length ?? 0}건\n`);

  let hitCount = 0;
  for (const row of (rows || [])) {
    const hmno = row.house_manage_no;
    try {
      const result = await getCmpet(hmno);
      const count = result?.matchCount ?? 0;
      const status = count > 0 ? `✓ ${count}건 (샘플: ${result.data.map(r => r.HOUSE_TY).join(',')})` : '✗ 없음';
      console.log(`  ${row.notice_month}  ${hmno}  ${String(row.house_name).slice(0, 20).padEnd(20)}  ${status}`);
      if (count > 0) hitCount += 1;
    } catch (e) {
      console.log(`  ${hmno}  오류: ${e.message}`);
    }
    await new Promise((r) => setTimeout(r, 200));
  }

  console.log(`\n결과: 총 ${rows?.length ?? 0}건 중 경쟁률 보유 ${hitCount}건`);
  if (hitCount > 0) {
    console.log('→ getAPTLttotPblancCmpet 가 pre-2020 데이터를 갖고 있음 — backfill 업데이트 가능');
  } else {
    console.log('→ pre-2020 경쟁률은 odcloud 에도 없음');
  }

  process.exit(0);
})().catch((e) => { console.error('FATAL', e); process.exit(1); });
