/**
 * 서린실업 사이트 SDK 번역 데이터 셋업
 * 1. 사이트 ID 조회
 * 2. ko.json 소스 메시지 업로드
 * 3. 활성 언어별 번역 자동 생성 + 저장
 *
 * 실행: npx tsx scripts/setup-seolin.ts
 */

const API_BASE = "https://taedong-translate.vercel.app";
const API_KEY = "td_tr_seolin_demo";

const koMessages = {
  nav: {
    company: "회사소개",
    greeting: "인사말",
    history: "회사연혁",
    location: "오시는길",
    certificates: "인증/특허",
    products: "제품",
    portfolio: "시공실적",
    notice: "공지사항",
    contact: "문의하기",
  },
  hero: {
    slide1_heading: "품질과 신뢰로 미래를 잇다",
    slide1_sub: "토목·건축 Joint 전문 자재의 선두주자, 서린실업",
    slide2_heading: "30년 기술력의 조인트 전문기업",
    slide2_sub: "설계부터 시공까지 Total Solution을 제공합니다",
    slide3_heading: "대한민국 건설의 든든한 파트너",
    slide3_sub: "500건 이상의 시공실적으로 검증된 품질",
    cta_products: "제품 보기",
    cta_contact: "상담 문의",
    badge_experience: "30년 업력",
    badge_portfolio: "500+ 시공실적",
  },
  about: {
    hero_title: "인사말",
    greeting_heading: "고객 여러분, 안녕하십니까.",
    greeting_p1:
      "(주)서린실업 홈페이지를 방문해 주신 여러분께 진심으로 감사드립니다.",
    greeting_p2:
      "저희 (주)서린실업은 1992년 창업 이래, 토목·건축 분야의 Joint 전문 자재를 공급하며 대한민국 건설 산업의 발전에 기여해 왔습니다.",
    greeting_thanks: "감사합니다.",
    greeting_ceo: "(주)서린실업 대표이사",
    greeting_ceo_name: "이병덕",
    values_heading: "핵심 가치",
    value1_title: "최고의 기술력",
    value1_desc:
      "끊임없는 연구개발을 통해 업계 최고의 기술력을 확보하고 있습니다.",
    value2_title: "품질 우선",
    value2_desc: "엄격한 품질 관리 시스템으로 최상의 제품만을 공급합니다.",
    value3_title: "고객 만족",
    value3_desc:
      "고객의 요구에 신속하고 정확하게 대응하여 최상의 만족을 드립니다.",
  },
  about_preview: {
    heading: "30년간 쌓아온 기술력과 신뢰",
    description:
      "1996년 설립 이래, 서린실업은 건축/토목 분야 조인트 전문 자재를 연구 개발하며 대한민국 건설 산업의 품질 향상에 기여하고 있습니다.",
    stat_years_label: "년 업력",
    stat_lineup_label: "제품 라인업",
    stat_portfolio_label: "시공실적",
    cta: "자세히 보기",
  },
  stats: {
    heading: "서린실업의 성과",
    stat1_label: "년 업력",
    stat2_label: "제품 라인업",
    stat3_label: "시공실적",
    stat4_label: "인증/특허",
  },
  cta_section: {
    heading: "제품 문의 및 상담",
    description: "전문 상담원이 빠르게 답변 드리겠습니다",
    cta_online: "온라인 상담",
  },
  history: {
    hero_title: "회사연혁",
    item_1992_title: "회사 설립",
    item_1992_desc: "(주)서린실업 설립, Joint 전문 자재 사업 시작",
    item_1995_title: "공장 설립",
    item_1995_desc: "충북 음성 공장 준공, 자체 생산 체계 구축",
    item_2000_title: "사업 확장",
    item_2000_desc: "토목·건축 자재 라인업 확대, 주요 건설사 납품 시작",
    item_2005_title: "기술 개발",
    item_2005_desc: "신제품 연구개발 강화, 특허 기술 확보",
    item_2010_title: "영업 확대",
    item_2010_desc: "경남 영업소 개설, 전국 영업망 구축",
    item_2015_title: "품질 인증",
    item_2015_desc: "품질 관리 시스템 고도화, 주요 인증 획득",
    item_2020_title: "지속 성장",
    item_2020_desc: "친환경 제품 개발, ESG 경영 도입",
    item_current_title: "미래 도약",
    item_current_desc: "디지털 전환 추진, 글로벌 시장 진출 준비",
  },
  location: {
    hero_title: "오시는 길",
    tab_headquarters: "본사",
    tab_factory: "공장",
    tab_branch: "영업소",
    kakaomap_link: "카카오맵에서 보기",
  },
  certificates: {
    hero_title: "인증/특허",
    hero_desc: "(주)서린실업이 보유한 인증 및 특허 현황입니다.",
  },
  products: {
    page_title: "제품소개",
    filter_all: "전체",
    filter_civil: "토목",
    filter_arch: "건축",
    filter_both: "토목/건축",
    section_heading: "주요 제품",
    view_detail: "자세히 보기",
    back_to_list: "제품 목록",
    detail_overview_heading: "제품 개요",
    detail_features_heading: "주요 특징",
    detail_specs_heading: "제품 사양",
    detail_applications_heading: "적용 분야",
    detail_install_heading: "시공 방법",
    cta_phone: "전화 문의",
    cta_online: "온라인 상담",
  },
  portfolio: {
    hero_title: "시공실적",
    hero_desc: "(주)서린실업이 참여한 주요 프로젝트를 소개합니다.",
  },
  notice: {
    hero_title: "공지사항",
    table_number: "번호",
    table_title: "제목",
    table_category: "분류",
    table_date: "등록일",
    empty_message: "등록된 공지사항이 없습니다.",
  },
  contact: {
    hero_title: "온라인상담",
    hero_desc: "궁금하신 사항을 남겨주시면 빠르게 답변 드리겠습니다.",
    form_name_label: "이름 / 회사명",
    form_phone_label: "연락처",
    form_email_label: "이메일",
    form_product_label: "관심 제품",
    form_message_label: "문의 내용",
    form_submit: "상담 신청",
    success_heading: "상담 신청이 완료되었습니다.",
    success_message: "빠른 시일 내에 연락드리겠습니다.",
    sidebar_contact_heading: "연락처 안내",
    sidebar_quick_heading: "빠른 상담",
    sidebar_quick_desc: "급한 문의는 전화로 연락 주세요.",
  },
  footer: {
    address_hq_label: "본사",
    address_factory_label: "공장",
    address_branch_label: "영업소",
    copyright: "(주)서린실업. All rights reserved.",
  },
  common: {
    view_detail: "자세히 보기",
    view_all: "전체보기",
    back_to_home: "홈으로 돌아가기",
    contact_us: "문의하기",
    online_consult: "온라인 상담",
    phone_consult: "전화 문의",
  },
};

async function main() {
  console.log("=== 서린실업 SDK 번역 데이터 셋업 ===\n");

  // 1. 사이트 목록에서 서린실업 ID 찾기
  console.log("1. 사이트 조회...");
  const sitesRes = await fetch(`${API_BASE}/api/sites`, {
    headers: { Authorization: `Bearer ${API_KEY}` },
  });
  const sitesData = await sitesRes.json();
  const sitesList = sitesData.sites || sitesData;
  const seolin = Array.isArray(sitesList)
    ? sitesList.find(
        (s: { apiKey: string }) => s.apiKey === "td_tr_seolin_demo",
      )
    : null;

  if (!seolin) {
    console.error(
      "서린실업 사이트를 찾을 수 없습니다. seed를 먼저 실행하세요.",
    );
    process.exit(1);
  }
  console.log(`   사이트: ${seolin.name} (ID: ${seolin.id})`);

  // 2. ko 소스 메시지 업로드
  console.log("\n2. 한국어 소스 메시지 업로드...");
  const koRes = await fetch(`${API_BASE}/api/sites/${seolin.id}/messages`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ locale: "ko", messages: koMessages }),
  });
  const koResult = await koRes.json();
  console.log(`   결과: ${koRes.ok ? "성공" : "실패"}`, koResult);

  // 3. 활성 언어 조회
  console.log("\n3. 활성 언어 조회...");
  const configRes = await fetch(`${API_BASE}/api/sites/config`, {
    headers: { Authorization: `Bearer ${API_KEY}` },
  });
  const config = await configRes.json();
  const targetLocales = (config.locales || []).filter(
    (l: string) => l !== "ko",
  );
  console.log(`   타겟 언어: ${targetLocales.join(", ")}`);

  // 4. 각 언어별 번역 생성 + 저장
  for (const locale of targetLocales) {
    console.log(`\n4. ${locale.toUpperCase()} 번역 생성 중...`);
    const genRes = await fetch(`${API_BASE}/api/sites/${seolin.id}/generate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ locale, sourceMessages: koMessages }),
    });

    if (!genRes.ok) {
      console.error(`   생성 실패: ${genRes.status}`);
      continue;
    }

    const genResult = await genRes.json();
    console.log(`   번역 완료, 저장 중...`);

    // 저장
    const saveRes = await fetch(`${API_BASE}/api/sites/${seolin.id}/messages`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ locale, messages: genResult.messages }),
    });
    console.log(`   ${locale} 저장: ${saveRes.ok ? "성공" : "실패"}`);
  }

  console.log("\n=== 셋업 완료 ===");
  console.log(
    `스크립트 태그: <script src="${API_BASE}/sdk.js" data-api-key="${API_KEY}" async></script>`,
  );
}

main().catch(console.error);
