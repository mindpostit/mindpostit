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

// ─────────────────────────────────────────────────
// 답장 시 유저에게 푸시 알림 발송
// threads/{threadId} 문서에서 status가 'replied'로 바뀔 때 트리거
// ─────────────────────────────────────────────────
exports.sendReplyNotification = functions
  .region('asia-northeast3')
  .firestore
  .document('threads/{threadId}')
  .onUpdate(async (change, context) => {
    const before = change.before.data();
    const after = change.after.data();

    // status가 waiting → replied 로 바뀔 때만 실행
    if (before.status !== 'waiting' || after.status !== 'replied') return null;

    const userId = after.userId;
    if (!userId) return null;

    // users 컬렉션에서 FCM 토큰 조회
    const userSnap = await db.collection('users')
      .where('userId', '==', userId)
      .limit(1)
      .get();

    if (userSnap.empty) {
      console.log('FCM 토큰 없음 - 알림 스킵');
      return null;
    }

    const fcmToken = userSnap.docs[0].data().fcmToken;
    if (!fcmToken) return null;

    // 푸시 발송
    const message = {
      token: fcmToken,
      notification: {
        title: '마인드포스팃',
        body: '답장이 도착했어요. 확인하러 오세요.'
      },
      webpush: {
        fcmOptions: {
          link: 'https://mindpostit.live'
        }
      }
    };

    try {
      await admin.messaging().send(message);
      console.log(`✅ 푸시 발송 완료 - userId: ${userId}`);
    } catch (error) {
      console.error('푸시 발송 오류:', error);
    }

    return null;
  });
