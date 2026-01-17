// 금칙어 필터 시스템
// 욕설은 OK, 위험한 내용은 NO

// 금칙어 목록 (매우 엄격)
const FORBIDDEN_WORDS = [
  // === 성범죄/성착취 ===
  '강간', '강제추행', '성폭행', '성폭력', '성추행', '몰카', '몰래카메라',
  '도촬', '불법촬영', '리벤지포르노', '성매매', '성상납', '원조교제',
  '조건만남', '조건', '보지사진', '자지사진', '누드사진', '야동찍',
  '섹스영상', '몸파', '몸캠', '화상채팅', '성노예', '성착취',
  
  // === 아동 관련 ===
  '아청법', '미성년자성관계', '아동성폭력', '아동학대', '유아성폭행',
  '초등학생성관계', '중학생성관계', '고등학생성관계', '청소년성매매',
  '미성년자강간', '아동포르노', '아동음란물',
  
  // === 폭력/살인 ===
  '살인', '살해', '목조르', '칼로찌르', '칼부림', '묻지마살인',
  '연쇄살인', '존속살해', '영아살해', '태아살해', '낙태알약',
  '독살', '음독', '청산가리', '사이안', '목매', '교살', '익사',
  '암매장', '시신유기', '사체훼손', '능지처참',
  
  // === 폭행/상해 ===
  '폭행하', '구타하', '린치', '집단폭행', '가정폭력', '데이트폭력',
  '납치', '감금', '인질', '테러', '폭탄제조', '화염병', '총기난사',
  
  // === 자해/자살 ===
  '자살', '자살방법', '자살하는법', '목매는법', '투신', '번지점프자살',
  '자해', '손목긋', '칼로긋', '칼질', '자해하', '같이죽',
  '동반자살', '일가족자살', '자살사이트', '자살카페',
  '수면제먹고', '수면제과다복용', '자살약',
  
  // === 불법 약물 ===
  '필로폰', '히로뽕', '마약', '대마초', '코카인', '헤로인',
  '엑스터시', 'LSD', '메스암페타민', '펜타닐', '몰핀', '케타민',
  '본드흡입', '가스흡입', '신나흡입', '환각제', '마약밀매',
  '마약투약', '마약제조', '대마재배', '양귀비재배',
  
  // === 불법 무기 ===
  '총기구입', '총구입', '권총', '엽총', '라이플', '산탄총',
  '총기밀매', '총알', '실탄', '폭탄제조법', 'C4폭탄', '수류탄',
  '화염병만들기', '도검난동', '칼부림',
  
  // === 사기/범죄 ===
  '보이스피싱', '전화금융사기', '대포폰', '대포통장', '장물',
  '주민번호판매', '개인정보판매', '명의도용', '위조지폐',
  '카드깡', '현금깡', '불법대부', '사채', '대출사기',
  
  // === 해킹/불법 ===
  '해킹방법', '디도스', '랜섬웨어', '악성코드제작', '스파이웨어',
  '피싱사이트', '해킹툴', '크랙프로그램', '불법다운로드',
  
  // === 개인정보 노출 (패턴) ===
  '주민등록번호', '주민번호', '계좌번호', '카드번호', '비밀번호',
  '전화번호공개', '주소공개', '집주소', '학교이름', '실명공개'
];

// 텍스트 정규화 함수 (띄어쓰기, 특수문자 제거)
const normalizeText = (text) => {
  return text
    .toLowerCase()
    .replace(/[\s\-_.,!@#$%^&*()+=[\]{};:'"|\\<>?/~`]/g, '')
    .replace(/[ㄱ-ㅎㅏ-ㅣ]/g, '');
};

// 금칙어 체크 함수
export const checkForbiddenWords = (text) => {
  const normalized = normalizeText(text);
  
  for (const word of FORBIDDEN_WORDS) {
    const normalizedWord = normalizeText(word);
    if (normalized.includes(normalizedWord)) {
      return {
        forbidden: true,
        word: word,
        message: '욕은 OK, 나쁜 말은 NO'
      };
    }
  }
  
  return {
    forbidden: false
  };
};

// 숫자 패턴 체크 (주민번호, 전화번호, 계좌번호)
export const checkSensitivePatterns = (text) => {
  const ssnPattern = /\d{6}[-\s]?\d{7}/;
  const phonePattern = /01[0-9][-\s]?\d{4}[-\s]?\d{4}/;
  const accountPattern = /\d{10,}/;
  
  if (ssnPattern.test(text)) {
    return {
      forbidden: true,
      message: '주민등록번호는 입력 불가'
    };
  }
  
  if (phonePattern.test(text)) {
    return {
      forbidden: true,
      message: '전화번호는 입력 불가'
    };
  }
  
  if (accountPattern.test(text)) {
    return {
      forbidden: true,
      message: '계좌번호는 입력 불가'
    };
  }
  
  return {
    forbidden: false
  };
};

// 통합 검사 함수
export const validateContent = (text) => {
  const wordCheck = checkForbiddenWords(text);
  if (wordCheck.forbidden) {
    return {
      valid: false,
      message: wordCheck.message
    };
  }
  
  const patternCheck = checkSensitivePatterns(text);
  if (patternCheck.forbidden) {
    return {
      valid: false,
      message: patternCheck.message
    };
  }
  
  return {
    valid: true
  };
};