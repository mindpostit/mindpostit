import { initializeApp } from 'firebase/app';
import { getFirestore, collection, addDoc, getDocs, updateDoc, doc, query, orderBy, serverTimestamp } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyBG5MofvBCD0y93vL-gT39bx76rNJWvztE",
  authDomain: "mindpostit-f0b48.firebaseapp.com",
  projectId: "mindpostit-f0b48",
  storageBucket: "mindpostit-f0b48.firebasestorage.app",
  messagingSenderId: "15997772650",
  appId: "1:15997772650:web:756fc4c75365316a74bb13",
  measurementId: "G-L8N7YGDBF4"
};

// Firebase 초기화
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// 주제 관련 함수들
export const getTopics = async () => {
  try {
    const topicsQuery = query(collection(db, 'topics'), orderBy('createdAt', 'desc'));
    const querySnapshot = await getDocs(topicsQuery);
    
    const topics = [];
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      topics.push({
        id: doc.id,
        text: data.text,
        createdAt: data.createdAt
      });
    });
    
    return { success: true, topics };
  } catch (error) {
    console.error("주제 불러오기 오류:", error);
    return { success: false, error, topics: [] };
  }
};

export const createTopic = async (text) => {
  try {
    const docRef = await addDoc(collection(db, 'topics'), {
      text: text,
      createdAt: serverTimestamp()
    });
    return { success: true, id: docRef.id };
  } catch (error) {
    console.error("주제 작성 오류:", error);
    return { success: false, error };
  }
};

export const deleteTopic = async (topicId) => {
  try {
    const { deleteDoc } = await import('firebase/firestore');
    await deleteDoc(doc(db, 'topics', topicId));
    return { success: true };
  } catch (error) {
    console.error("주제 삭제 오류:", error);
    return { success: false, error };
  }
};

// 글 작성 함수 (topic 추가)
export const createPost = async (content, wantDeeper, topic = null) => {
  try {
    const docRef = await addDoc(collection(db, 'posts'), {
      content: content,
      author: "익명",
      createdAt: serverTimestamp(),
      echoes: 0,
      echoMessages: {}, // 공감 메시지 저장 (예: {"나도 그래요": 3, "힘내세요": 2})
      wantDeeper: wantDeeper,
      topic: topic,
      comments: []
    });
    return { success: true, id: docRef.id };
  } catch (error) {
    console.error("글 작성 오류:", error);
    return { success: false, error };
  }
};

// 글 목록 불러오기
export const getPosts = async () => {
  try {
    const postsQuery = query(collection(db, 'posts'), orderBy('createdAt', 'desc'));
    const querySnapshot = await getDocs(postsQuery);
    
    const posts = [];
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      posts.push({
        id: doc.id,
        content: data.content,
        author: data.author,
        echoes: data.echoes || 0,
        echoMessages: data.echoMessages || {},
        wantDeeper: data.wantDeeper || false,
        topic: data.topic || null,
        comments: data.comments || [],
        createdAt: data.createdAt
      });
    });
    
    return { success: true, posts };
  } catch (error) {
    console.error("글 불러오기 오류:", error);
    return { success: false, error, posts: [] };
  }
};

// 메아리 추가 함수 (공감 메시지 포함)
export const addEchoWithMessage = async (postId, message, currentEchoMessages) => {
  try {
    const postRef = doc(db, 'posts', postId);
    
    // 기존 메시지 카운트 증가 또는 새로 추가
    const updatedMessages = { ...currentEchoMessages };
    updatedMessages[message] = (updatedMessages[message] || 0) + 1;
    
    // 전체 메아리 수 계산
    const totalEchoes = Object.values(updatedMessages).reduce((sum, count) => sum + count, 0);
    
    await updateDoc(postRef, {
      echoes: totalEchoes,
      echoMessages: updatedMessages
    });
    
    return { success: true };
  } catch (error) {
    console.error("메아리 추가 오류:", error);
    return { success: false, error };
  }
};

// 댓글 추가 함수
export const addComment = async (postId, comment, currentComments) => {
  try {
    const postRef = doc(db, 'posts', postId);
    const newComment = {
      author: "들림이",
      content: comment,
      createdAt: new Date().toISOString()
    };
    
    await updateDoc(postRef, {
      comments: [...currentComments, newComment]
    });
    
    return { success: true, comment: newComment };
  } catch (error) {
    console.error("댓글 추가 오류:", error);
    return { success: false, error };
  }
};

// 오늘의 포스트잇 가져오기/설정
export const getTodaysFeaturedPost = async () => {
  try {
    const featuredQuery = query(collection(db, 'featured'), orderBy('date', 'desc'));
    const querySnapshot = await getDocs(featuredQuery);
    
    if (querySnapshot.empty) return { success: true, featured: null };
    
    const latestFeatured = querySnapshot.docs[0].data();
    const today = new Date().toDateString();
    const featuredDate = latestFeatured.date?.toDate ? latestFeatured.date.toDate().toDateString() : null;
    
    // 오늘 날짜와 같으면 반환
    if (featuredDate === today) {
      return { success: true, featured: latestFeatured };
    }
    
    return { success: true, featured: null };
  } catch (error) {
    console.error("오늘의 포스트잇 가져오기 오류:", error);
    return { success: false, error, featured: null };
  }
};

export const setTodaysFeaturedPost = async (postId) => {
  try {
    await addDoc(collection(db, 'featured'), {
      postId: postId,
      date: serverTimestamp()
    });
    return { success: true };
  } catch (error) {
    console.error("오늘의 포스트잇 설정 오류:", error);
    return { success: false, error };
  }
};

export default db;