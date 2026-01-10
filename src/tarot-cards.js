// 타로 카드 데이터 (Major Arcana 22장 + 자주 쓰는 Minor Arcana)
export const tarotCards = [
  // Major Arcana (주요 카드)
  {
    id: 0,
    name: "The Fool",
    korean: "광대",
    keywords: ["새로운 시작", "순수함", "모험", "자유"],
    upright: "새로운 시작, 순수한 마음, 자유로운 영혼",
    reversed: "무모함, 방황, 불안정"
  },
  {
    id: 1,
    name: "The Magician",
    korean: "마법사",
    keywords: ["의지", "창조", "능력", "시작"],
    upright: "의지와 창조력, 자신감, 능력 발휘",
    reversed: "조작, 거짓, 능력 부족"
  },
  {
    id: 2,
    name: "The High Priestess",
    korean: "여사제",
    keywords: ["직관", "내면", "비밀", "지혜"],
    upright: "직관과 내면의 지혜, 비밀, 영적 성장",
    reversed: "무시된 직관, 표면적 지식"
  },
  {
    id: 3,
    name: "The Empress",
    korean: "여제",
    keywords: ["풍요", "창조", "모성", "자연"],
    upright: "풍요와 창조, 모성애, 자연과의 조화",
    reversed: "과잉보호, 의존성"
  },
  {
    id: 4,
    name: "The Emperor",
    korean: "황제",
    keywords: ["권위", "안정", "구조", "통제"],
    upright: "권위와 안정, 구조와 질서, 리더십",
    reversed: "독재, 경직성"
  },
  {
    id: 5,
    name: "The Hierophant",
    korean: "교황",
    keywords: ["전통", "가르침", "제도", "신념"],
    upright: "전통과 가르침, 정신적 지도, 제도",
    reversed: "반항, 독단적"
  },
  {
    id: 6,
    name: "The Lovers",
    korean: "연인",
    keywords: ["사랑", "선택", "조화", "관계"],
    upright: "사랑과 선택, 조화로운 관계, 가치관",
    reversed: "갈등, 불화, 잘못된 선택"
  },
  {
    id: 7,
    name: "The Chariot",
    korean: "전차",
    keywords: ["의지", "승리", "통제", "전진"],
    upright: "강한 의지, 승리, 목표 달성, 자기 통제",
    reversed: "좌절, 방향 상실"
  },
  {
    id: 8,
    name: "Strength",
    korean: "힘",
    keywords: ["용기", "인내", "자제", "내면의 힘"],
    upright: "용기와 인내, 내면의 힘, 자기 통제",
    reversed: "나약함, 자신감 결여"
  },
  {
    id: 9,
    name: "The Hermit",
    korean: "은둔자",
    keywords: ["고독", "성찰", "내면 탐구", "지혜"],
    upright: "고독한 성찰, 내면 탐구, 영적 지혜",
    reversed: "고립, 외로움"
  },
  {
    id: 10,
    name: "Wheel of Fortune",
    korean: "운명의 수레바퀴",
    keywords: ["운명", "변화", "순환", "기회"],
    upright: "운명의 전환점, 긍정적 변화, 새 기회",
    reversed: "악순환, 불운"
  },
  {
    id: 11,
    name: "Justice",
    korean: "정의",
    keywords: ["공정", "균형", "진실", "결과"],
    upright: "공정함과 균형, 진실, 인과응보",
    reversed: "불공정, 편견"
  },
  {
    id: 12,
    name: "The Hanged Man",
    korean: "매달린 사람",
    keywords: ["희생", "관점 전환", "정지", "깨달음"],
    upright: "희생과 헌신, 새로운 관점, 깨달음",
    reversed: "헛된 희생, 저항"
  },
  {
    id: 13,
    name: "Death",
    korean: "죽음",
    keywords: ["끝", "변화", "변신", "새 시작"],
    upright: "끝과 새 시작, 근본적 변화, 변신",
    reversed: "변화 거부, 정체"
  },
  {
    id: 14,
    name: "Temperance",
    korean: "절제",
    keywords: ["균형", "조화", "치유", "통합"],
    upright: "균형과 조화, 절제, 치유와 통합",
    reversed: "불균형, 과잉"
  },
  {
    id: 15,
    name: "The Devil",
    korean: "악마",
    keywords: ["유혹", "집착", "속박", "물질"],
    upright: "유혹과 집착, 물질적 속박, 중독",
    reversed: "해방, 자유"
  },
  {
    id: 16,
    name: "The Tower",
    korean: "탑",
    keywords: ["파괴", "충격", "급변", "깨달음"],
    upright: "급작스런 변화, 충격, 파괴 후 재건",
    reversed: "피할 수 없는 변화"
  },
  {
    id: 17,
    name: "The Star",
    korean: "별",
    keywords: ["희망", "치유", "영감", "평화"],
    upright: "희망과 치유, 영감, 평화와 고요",
    reversed: "실망, 희망 상실"
  },
  {
    id: 18,
    name: "The Moon",
    korean: "달",
    keywords: ["불안", "환상", "직관", "무의식"],
    upright: "불안과 두려움, 환상, 무의식의 메시지",
    reversed: "혼란, 기만"
  },
  {
    id: 19,
    name: "The Sun",
    korean: "태양",
    keywords: ["기쁨", "성공", "활력", "긍정"],
    upright: "기쁨과 성공, 활력, 긍정적 에너지",
    reversed: "일시적 우울"
  },
  {
    id: 20,
    name: "Judgement",
    korean: "심판",
    keywords: ["각성", "평가", "결정", "재탄생"],
    upright: "각성과 깨달음, 평가, 재탄생",
    reversed: "자기 의심, 후회"
  },
  {
    id: 21,
    name: "The World",
    korean: "세계",
    keywords: ["완성", "성취", "통합", "여행"],
    upright: "완성과 성취, 통합, 세계로의 확장",
    reversed: "미완성, 지연"
  },
  
  // Minor Arcana (자주 쓰는 카드들)
  {
    id: 100,
    name: "Ace of Cups",
    korean: "컵 에이스",
    keywords: ["새로운 감정", "사랑", "직관", "영적 시작"],
    upright: "새로운 사랑, 감정의 시작, 영적 각성",
    reversed: "감정 억압, 사랑 결핍"
  },
  {
    id: 101,
    name: "Two of Cups",
    korean: "컵 2",
    keywords: ["관계", "파트너십", "조화", "사랑"],
    upright: "조화로운 관계, 파트너십, 상호 존중",
    reversed: "불화, 관계 문제"
  },
  {
    id: 102,
    name: "Three of Cups",
    korean: "컵 3",
    keywords: ["축하", "우정", "공동체", "기쁨"],
    upright: "축하와 기쁨, 우정, 공동체 의식",
    reversed: "과잉, 배신"
  },
  {
    id: 200,
    name: "Ace of Swords",
    korean: "검 에이스",
    keywords: ["명확성", "진실", "돌파구", "정신"],
    upright: "명확한 사고, 진실, 새로운 아이디어",
    reversed: "혼란, 잘못된 판단"
  },
  {
    id: 201,
    name: "Two of Swords",
    korean: "검 2",
    keywords: ["갈등", "결정", "균형", "회피"],
    upright: "어려운 결정, 양자택일, 갈등",
    reversed: "결정 회피, 정보 부족"
  },
  {
    id: 202,
    name: "Five of Swords",
    korean: "검 5",
    keywords: ["갈등", "패배", "부정적", "다툼"],
    upright: "갈등과 다툼, 승리의 대가, 패배감",
    reversed: "용서, 화해"
  },
  {
    id: 300,
    name: "Ace of Wands",
    korean: "완드 에이스",
    keywords: ["열정", "창조", "영감", "시작"],
    upright: "열정과 영감, 창조적 시작, 새 프로젝트",
    reversed: "열정 부족, 지연"
  },
  {
    id: 301,
    name: "Three of Wands",
    korean: "완드 3",
    keywords: ["확장", "전망", "진전", "기회"],
    upright: "확장과 진전, 미래 전망, 새 기회",
    reversed: "좌절, 장애물"
  },
  {
    id: 400,
    name: "Ace of Pentacles",
    korean: "펜타클 에이스",
    keywords: ["번영", "기회", "물질", "시작"],
    upright: "물질적 기회, 번영, 새로운 시작",
    reversed: "기회 상실, 불안정"
  },
  {
    id: 401,
    name: "Four of Pentacles",
    korean: "펜타클 4",
    keywords: ["안정", "집착", "통제", "보수"],
    upright: "안정과 보수, 통제, 집착",
    reversed: "인색함, 강박"
  },
  {
    id: 402,
    name: "Ten of Pentacles",
    korean: "펜타클 10",
    keywords: ["완성", "안정", "가족", "유산"],
    upright: "물질적 완성, 가족, 안정된 미래",
    reversed: "재정 불안, 가족 갈등"
  }
];

export default tarotCards;