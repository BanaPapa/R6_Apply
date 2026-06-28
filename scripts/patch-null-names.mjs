#!/usr/bin/env node
/**
 * pre-2020 apply_announcements 중 house_name 또는 region 이 NULL 인 행을
 * 청약홈 detail 재파싱으로 채운다. constructor 도 함께 추출.
 *
 * 사용:
 *   node --env-file=.env scripts/patch-null-names.mjs
 */
import axios from 'axios';
import * as cheerio from 'cheerio';
import { getSupabaseAdmin } from '../lib/supabase/serverClient.mjs';

const APPLYHOME = 'https://www.applyhome.co.kr';
const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120.0 Safari/537.36';
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const num = (v) => { const n = parseInt(String(v || '').replace(/[^\d]/g, ''), 10); return Number.isFinite(n) ? n : 0; };

async function fetchDetailSupply(hmno) {
  try {
    const res = await axios.get(`${APPLYHOME}/ai/aia/selectAPTLttotPblancDetail.do`, {
      params: { houseManageNo: hmno, pblancNo: hmno },
      headers: { 'User-Agent': UA }, responseType: 'arraybuffer', timeout: 20000, validateStatus: () => true,
    });
    const t = cheerio.load(res.data.toString('utf-8'))('body').text().replace(/\s+/g, ' ').trim();
    if (t.length < 2500) return null;
    const date = (t.match(/모집공고일\s+(20\d{2}-\d{2}-\d{2})/) || [])[1];
    if (!date) return null;

    // 단지명: 전각문자 포함 + "입주자모집공고 주요정보" 중복 prefix 건너뜀
    const nameRaw = (t.match(/주요정보\s+(?:입주자모집공고\s+주요정보\s+)?(.{2,60}?)\s+공급위치/) || [])[1] || '';
    const name = nameRaw.replace(/^입주자모집공고\s+주요정보\s+/, '').trim();

    // 공급위치: 전각문자 포함 (.{} 사용)
    const loc = (t.match(/공급위치\s+(.{4,80}?)\s+공급규모/) || [])[1]?.trim() || '';

    // 지역: 공급위치 첫 단어 (시/도)
    const region = (loc.split(' ')[0] || '').trim() || null;

    // 세대수
    const scale = num((t.match(/공급규모\s+([\d,]+)\s*세대/) || [])[1]);

    // 시공사: "전화번호 [시행사] [시공사] [전화번호]" — 두 번째 단어가 시공사
    const constructorMatch = t.match(/전화번호\s+\S+\s+([^\s\*☎]+)/);
    const constructor = constructorMatch ? constructorMatch[1].trim() || null : null;

    return { hmno, date, name, loc, region, scale, constructor };
  } catch { return null; }
}

(async () => {
  const sb = getSupabaseAdmin();
  if (!sb) { console.error('✗ Supabase 미설정'); process.exit(1); }

  // house_name 이 NULL 이거나 region 이 NULL 인 pre-2020 행 전체
  const { data: rows, error } = await sb
    .from('apply_announcements')
    .select('house_manage_no, pblanc_no, house_name, region, constructor, notice_month')
    .lt('notice_month', '202002')
    .or('house_name.is.null,region.is.null,constructor.is.null')
    .order('notice_month', { ascending: true });

  if (error) { console.error('조회 실패:', error.message); process.exit(1); }
  console.log(`재파싱 대상: ${rows.length}건 (house_name NULL 또는 region NULL)`);

  let fixed = 0, skipped = 0;
  for (const row of rows) {
    const hmno = row.house_manage_no;
    const d = await fetchDetailSupply(hmno);
    await sleep(50);

    if (!d) { skipped += 1; continue; }

    const update = {};
    if (!row.house_name && d.name) update.house_name = d.name;
    if (!row.region && d.region) update.region = d.region;
    if (!row.constructor && d.constructor) update.constructor = d.constructor;
    update.last_crawled_at = new Date().toISOString();

    if (Object.keys(update).length <= 1) { skipped += 1; continue; } // last_crawled_at 만 있으면 스킵

    const { error: upErr } = await sb
      .from('apply_announcements')
      .update(update)
      .eq('house_manage_no', hmno)
      .eq('pblanc_no', row.pblanc_no);

    if (upErr) { console.error(`  ${hmno} 업데이트 실패: ${upErr.message}`); continue; }
    fixed += 1;
    if (fixed % 20 === 0) console.log(`  ${fixed}건 복구 (건너뜀 ${skipped}건)`);
  }

  console.log(`\n✓ 완료 — 복구 ${fixed}건, 파싱불가 ${skipped}건`);
  process.exit(0);
})().catch((e) => { console.error('FATAL', e); process.exit(1); });
