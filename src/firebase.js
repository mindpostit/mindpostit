import { initializeApp } from 'firebase/app';
import {
  getFirestore, collection, addDoc, getDocs, updateDoc, setDoc,
  doc, query, orderBy, where, serverTimestamp, onSnapshot
} from 'firebase/firestore';
import {
  getAuth, signInAnonymously, createUserWithEmailAndPassword,
  signInWithEmailAndPassword, sendPasswordResetEmail, signOut,
  onAuthStateChanged, linkWithCredential, EmailAuthProvider
} from 'firebase/auth';
import { getAnalytics } from 'firebase/analytics';
import { getMessaging, getToken, onMessage } from 'firebase/messaging';

const firebaseConfig = {
  apiKey: "AIzaSyBG5MofvBCD0y93vL-gT39bx76rNJWvztE",
  authDomain: "mindpostit-f0b48.firebaseapp.com",
  projectId: "mindpostit-f0b48",
  storageBucket: "mindpostit-f0b48.firebasestorage.app",
  messagingSenderId: "15997772650",
  appId: "1:15997772650:web:756fc4c75365316a74bb13",
  measurementId: "G-L8N7YGDBF4"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);
const analytics = typeof window !== 'undefined' ? getAnalytics(app) : null;

// ── AUTH ─────────────────────────────────────

export const signInAnon = async () => {
  try {
    const result = await signInAnonymously(auth);
    return { success: true, user: result.user };
  } catch (error) {
    console.error('익명 로그인 오류:', error);
    return { success: false, error };
  }
};

export const signUpWithEmail = async (email, password) => {
  try {
    const currentUser = auth.currentUser;
    if (currentUser && currentUser.isAnonymous) {
      const credential = EmailAuthProvider.credential(email, password);
      const result = await linkWithCredential(currentUser, credential);
      return { success: true, user: result.user };
    }
    const result = await createUserWithEmailAndPassword(auth, email, password);
    return { success: true, user: result.user };
  } catch (error) {
    console.error('회원가입 오류:', error);
    let message = '회원가입에 실패했어요. 다시 시도해줘요.';
    if (error.code === 'auth/email-already-in-use') message = '이미 사용 중인 이메일이에요.';
    if (error.code === 'auth/weak-password') message = '비밀번호는 6자 이상이어야 해요.';
    if (error.code === 'auth/invalid-email') message = '이메일 형식이 올바르지 않아요.';
    return { success: false, error, message };
  }
};

export const signInWithEmail = async (email, password) => {
  try {
    const result = await signInWithEmailAndPassword(auth, email, password);
    return { success: true, user: result.user };
  } catch (error) {
    console.error('로그인 오류:', error);
    let message = '로그인에 실패했어요. 이메일과 비밀번호를 확인해줘요.';
    if (error.code === 'auth/user-not-found') message = '가입되지 않은 이메일이에요.';
    if (error.code === 'auth/wrong-password') message = '비밀번호가 올바르지 않아요.';
    if (error.code === 'auth/invalid-email') message = '이메일 형식이 올바르지 않아요.';
    if (error.code === 'auth/invalid-credential') message = '이메일 또는 비밀번호가 올바르지 않아요.';
    return { success: false, error, message };
  }
};

export const resetPassword = async (email) => {
  try {
    await sendPasswordResetEmail(auth, email);
    return { success: true };
  } catch (error) {
    console.error('비밀번호 재설정 오류:', error);
    return { success: false, error };
  }
};

export const logOut = async () => {
  try {
    await signOut(auth);
    return { success: true };
  } catch (error) {
    console.error('로그아웃 오류:', error);
    return { success: false, error };
  }
};

export const onAuthChange = (callback) => {
  return onAuthStateChanged(auth, callback);
};

// ── THREADS ──────────────────────────────────

export const createThread = async (userId, content, type = 'text') => {
  try {
    const uid = auth.currentUser?.uid || userId;
    const threadRef = await addDoc(collection(db, 'threads'), {
      userId: uid,
      status: 'waiting',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      lastMessage: content.slice(0, 50),
      isAnonymous: auth.currentUser?.isAnonymous || false,
      isAlert: false
    });
    await addDoc(collection(db, 'threads', threadRef.id, 'messages'), {
      content,
      role: 'user',
      type,
      createdAt: serverTimestamp()
    });
    return { success: true, threadId: threadRef.id };
  } catch (error) {
    console.error('스레드 생성 오류:', error);
    return { success: false, error };
  }
};

export const addMessage = async (threadId, content, role = 'user', type = 'text') => {
  try {
    await addDoc(collection(db, 'threads', threadId, 'messages'), {
      content, role, type, createdAt: serverTimestamp()
    });
    await updateDoc(doc(db, 'threads', threadId), {
      updatedAt: serverTimestamp(),
      lastMessage: content.slice(0, 50),
      status: role === 'admin' ? 'replied' : 'waiting'
    });
    return { success: true };
  } catch (error) {
    console.error('메시지 추가 오류:', error);
    return { success: false, error };
  }
};

export const subscribeMessages = (threadId, callback) => {
  const q = query(
    collection(db, 'threads', threadId, 'messages'),
    orderBy('createdAt', 'asc')
  );
  return onSnapshot(q, (snapshot) => {
    callback(snapshot.docs.map(d => ({ id: d.id, ...d.data() })));
  });
};

export const subscribeUserThreads = (userId, callback) => {
  const q = query(
    collection(db, 'threads'),
    where('userId', '==', userId),
    orderBy('updatedAt', 'desc')
  );
  return onSnapshot(q, (snapshot) => {
    callback(snapshot.docs.map(d => ({ id: d.id, ...d.data() })));
  });
};

// ── ADMIN ────────────────────────────────────

export const subscribeAllThreads = (callback) => {
  const q = query(collection(db, 'threads'), orderBy('updatedAt', 'desc'));
  return onSnapshot(q, (snapshot) => {
    callback(snapshot.docs.map(d => ({ id: d.id, ...d.data() })));
  });
};

export const setThreadAlert = async (threadId, isAlert) => {
  try {
    await updateDoc(doc(db, 'threads', threadId), { isAlert });
    return { success: true };
  } catch (error) {
    console.error('주의 플래그 오류:', error);
    return { success: false, error };
  }
};

// ── FCM 푸시 알림 ─────────────────────────────

const VAPID_KEY = 'BJSY9pFhsVuxlPr-LHGPI5-Hl27HkdS5vlczEcI7HEYAi9W1Kww1KHaB973myJMSdxAaugb5iso7g_S28mbGQx8';

export const requestNotificationPermission = async (userId) => {
  try {
    const permission = await Notification.requestPermission();
    if (permission !== 'granted') return { success: false, reason: 'denied' };

    const messaging = getMessaging(app);
    const token = await getToken(messaging, { vapidKey: VAPID_KEY });
    if (!token) return { success: false, reason: 'no_token' };

    // userId를 문서 ID로 사용해서 저장 (merge: true로 덮어쓰기)
    await setDoc(doc(db, 'users', userId), {
      userId,
      fcmToken: token,
      updatedAt: serverTimestamp()
    }, { merge: true });

    console.log('FCM 토큰 저장 완료:', token);
    return { success: true, token };
  } catch (error) {
    console.error('알림 권한 오류:', error);
    return { success: false, error };
  }
};

export const onForegroundMessage = (callback) => {
  const messaging = getMessaging(app);
  return onMessage(messaging, callback);
};

export { analytics, auth, db };
export default db;
