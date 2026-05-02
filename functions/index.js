const functions = require('firebase-functions');
const admin = require('firebase-admin');
admin.initializeApp();

const db = admin.firestore();

// ─────────────────────────────────────────────────
// 익명 글 24시간 자동 삭제
// 매일 새벽 4시 (KST) 실행
// isAnonymous: true 이고 생성된 지 24시간 이상 된 스레드 삭제
// ─────────────────────────────────────────────────
exports.deleteAnonymousThreads = functions
  .region('asia-northeast3')
  .pubsub
  .schedule('0 4 * * *')
  .timeZone('Asia/Seoul')
  .onRun(async (context) => {
    console.log('🗑️ 익명 글 자동 삭제 시작');

    const cutoff = new Date();
    cutoff.setHours(cutoff.getHours() - 24);

    const snapshot = await db.collection('threads')
      .where('isAnonymous', '==', true)
      .where('createdAt', '<=', cutoff)
      .get();

    if (snapshot.empty) {
      console.log('삭제할 익명 글 없음');
      return null;
    }

    const batch = db.batch();
    let count = 0;

    for (const doc of snapshot.docs) {
      // 서브컬렉션(messages)도 삭제
      const messages = await doc.ref.collection('messages').get();
      messages.forEach(msg => batch.delete(msg.ref));
      batch.delete(doc.ref);
      count++;
    }

    await batch.commit();
    console.log(`✅ 익명 글 ${count}건 삭제 완료`);
    return null;
  });
