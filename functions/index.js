const functions = require('firebase-functions');
const admin = require('firebase-admin');
admin.initializeApp();

// 더미글 템플릿
const dummyTemplates = {
  // 애매한 생각 (50%)
  vague: [
    "뭔가 이상한데 뭔지 모르겠고",
    "오늘 하루도 그냥",
    "생각이 너무 많아서 생각이 안돼",
    "이게 맞나 싶은데 뭐",
    "그냥 그런 날이었음",
    "말로 설명 못하겠는데",
    "뭔가 찝찝한 기분",
    "이런 느낌 처음인데",
    "왜 이러는지 모르겠어",
    "그냥 이상함",
    "오늘은 뭔가",
    "생각 정리가 안 돼",
    "이럴 때도 있지 뭐",
    "별로 할 말은 없는데",
    "그냥 써봄",
    "뭔가",
    "이상함",
    "모르겠음",
    "그냥",
    "뭔지",
    "그런 거 있잖아",
    "설명이 안 됨",
    "애매함",
    "왜인지",
    "좀 그럼"
  ],
  
  // 가벼운 일상 (30%)
  daily: [
    "라면 먹다가 생각남",
    "버스 놓쳐서 걸어왔는데",
    "유튜브 보다가 새벽 됨",
    "커피 너무 많이 마심",
    "내일 뭐하지",
    "핸드폰만 보다가 시간 다갔네",
    "배고픈데 먹을 거 없고",
    "세탁기 돌렸는데 까먹음",
    "오늘도 아무것도 안 했네",
    "비 오는 소리 듣고 있음",
    "창문 열었다 닫았다",
    "이불 밖은 위험해",
    "물 마시러 일어났는데",
    "택배 언제 오려나",
    "피곤",
    "졸림",
    "배고픔",
    "심심",
    "눕고 싶다",
    "자야 하는데",
    "폰 좀 그만 봐야지",
    "물 마셔야지"
  ],
  
  // 깊은 감정 (20%)
  deep: [
    "왜 이렇게 외로운지 모르겠어",
    "다 잘하는 것 같은데 나만",
    "연락 오기만 기다리는 나",
    "이대로 괜찮을까",
    "아무도 모를 거야",
    "혼자인 게 편한데 또 외롭고",
    "다들 잘 사는 것 같은데",
    "나만 이런가",
    "어떻게 해야 할지",
    "말 걸고 싶은데 용기가 안 나",
    "이렇게 살면 안 되는데",
    "누구한테 말해야 하나",
    "외로움",
    "쓸쓸함",
    "무서움",
    "지침",
    "그립다",
    "혼자다"
  ]
};

// 랜덤 선택 함수
function getRandomTemplate() {
  const rand = Math.random();
  let category;
  
  if (rand < 0.5) {
    category = 'vague'; // 50%
  } else if (rand < 0.8) {
    category = 'daily'; // 30%
  } else {
    category = 'deep'; // 20%
  }
  
  const templates = dummyTemplates[category];
  return templates[Math.floor(Math.random() * templates.length)];
}

// 더미글 생성 함수
async function createDummyPost() {
  const content = getRandomTemplate();
  
  await admin.firestore().collection('posts').add({
    content: content,
    author: '익명',
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
    echoes: 0,
    echoMessages: {},
    comments: [],
    wantDeeper: false,
    topic: null,
    isDummy: true // 더미글 표시 (나중에 삭제 쉽게)
  });
  
  console.log(`✅ 더미글 생성: ${content}`);
}

// 01:12 실행 (KST)
exports.dummyPost1 = functions
  .region('asia-northeast3') // 서울 리전
  .pubsub
  .schedule('12 1 * * *')
  .timeZone('Asia/Seoul')
  .onRun(async (context) => {
    console.log('🌙 01:12 더미글 생성 시작');
    await createDummyPost();
    return null;
  });

// 02:48 실행 (KST)
exports.dummyPost2 = functions
  .region('asia-northeast3')
  .pubsub
  .schedule('48 2 * * *')
  .timeZone('Asia/Seoul')
  .onRun(async (context) => {
    console.log('🌙 02:48 더미글 생성 시작');
    await createDummyPost();
    return null;
  });

// 수동 테스트용 (HTTP 트리거)
exports.testDummyPost = functions
  .region('asia-northeast3')
  .https
  .onRequest(async (req, res) => {
    try {
      await createDummyPost();
      res.json({ success: true, message: '더미글 생성 완료!' });
    } catch (error) {
      console.error('에러:', error);
      res.status(500).json({ success: false, error: error.message });
    }
  });
