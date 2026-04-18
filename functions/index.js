const functions = require('firebase-functions');
const admin = require('firebase-admin');
admin.initializeApp();

// 더미글 템플릿
const dummyTemplates = {
  // 하루 털어내기 - 애매한 감정 (50%)
  vague: [
    "오늘 하루 꾹 눌러놨던 거 여기다 뱉음",
    "뭔가 찜찜한 채로 하루 끝남",
    "말하진 않았지만 좀 힘들었음",
    "자려고 누웠는데 생각이 많아",
    "오늘 하루 그냥 버텼다",
    "별건 아닌데 좀 지쳤어",
    "이런 거 누구한테 말하겠어",
    "오늘도 그냥 지나가는 중",
    "자기 전에 한 번 털어내고 자야지",
    "하루 종일 참았던 거 여기다 그냥",
    "잠들기 전에 머릿속 비우는 중",
    "오늘 하루 수고했다 나",
    "뭔가",
    "그냥",
    "모르겠음",
    "좀 그럼",
    "애매함",
    "설명이 안 됨",
    "이상함",
    "왜인지",
    "좀 힘들었음",
    "별로였음",
    "그냥 그런 날",
    "말하기 귀찮음",
    "그런 거 있잖아",
    "딱히 뭐라 할 말은 없는데 그냥 써봄",
    "오늘 뭔가 꽉 막힌 느낌",
    "감정이 뭔지 모르겠음",
    "오늘 하루 왜 이렇게 무거웠지",
    "뭔가 억울한 것도 아니고 그렇다고 슬픈 것도 아닌데",
    "그냥 다 내려놓고 싶다",
    "말로 꺼내기엔 너무 작은 것들",
    "오늘 나한테 좀 미안했음",
    "이게 뭔지 모르겠어서 적음",
    "그냥 이 기분 어딘가에 남기고 싶었어"
  ],
  
  // 하루 털어내기 - 가벼운 일상 (30%)
  daily: [
    "오늘 하루 별거 없었는데 피곤함",
    "퇴근하고 씻고 누웠음. 오늘 끝",
    "밥은 먹었는데 뭔가 허전함",
    "내일도 똑같은 하루겠지",
    "핸드폰 보다가 자야지 하는 중",
    "오늘 별로 말 안 했네",
    "이불 속에서 오늘 복기 중",
    "자기 전에 물 한 잔 마시고",
    "오늘 하루도 잘 버텼다",
    "내일은 좀 나을 거야",
    "피곤한데 잠이 안 와",
    "이불 밖은 위험해",
    "자야 하는데 눈이 말똥말똥",
    "오늘 하루 정리하는 중",
    "피곤",
    "졸림",
    "눕고 싶다",
    "심심",
    "배고픔",
    "폰 좀 그만 봐야지",
    "자야지",
    "물 마셔야지",
    "오늘 하루도 어찌저찌 끝남",
    "밥 먹고 씻고 누웠는데 잠이 안 옴",
    "내일 뭐하지 생각하다가 잠드는 패턴",
    "아무것도 안 했는데 왜 이렇게 피곤하지",
    "오늘 딱 한 가지만 잘했다",
    "자려고 불 껐는데 생각이 켜짐",
    "창밖 소리 들으면서 그냥 있음",
    "오늘 날씨만큼은 좋았음"
  ],
  
  // 하루 털어내기 - 깊은 감정 (20%)
  deep: [
    "오늘 하루 꾹 참았던 거 여기서만 털어냄",
    "낮에 말 못했던 거 여기다 놓고 자야지",
    "혼자 삭혔는데 이제 좀 내려놓을게",
    "아무도 모르는 오늘 하루",
    "이대로 자면 내일도 무거울 것 같아서",
    "다들 잘 사는 것 같은데 나는",
    "말하면 뭐가 달라지겠어 그냥 뱉음",
    "오늘 하루 외로웠음",
    "연락 오기만 기다렸던 하루",
    "혼자인 게 편한데 또 외롭고",
    "나만 이런가",
    "누군가 읽어주는 것만으로 됨",
    "외로움",
    "쓸쓸함",
    "지침",
    "그립다",
    "혼자다",
    "무서움",
    "오늘 나 좀 많이 작아진 것 같았어",
    "괜찮다고 했는데 사실 별로 안 괜찮았음",
    "웃으면서 보냈는데 집에 오니까 공허함",
    "아무한테도 말 못 할 것 같아서 여기 씀",
    "누가 그냥 옆에 있어줬으면 했던 하루",
    "오늘 많이 지쳤어. 그냥 그 말 하고 싶었음",
    "내가 나한테 제일 못해준 날인 것 같음",
    "괜찮은 척 너무 오래 한 것 같아",
    "자기 전에 한 번만 솔직하게. 힘들었어"
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
