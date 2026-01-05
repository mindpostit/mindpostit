import { getFirestore, collection, addDoc, getDocs, updateDoc, doc, query, orderBy, serverTimestamp, deleteDoc } from 'firebase/firestore';
import { initializeApp } from 'firebase/app';


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

// 글 작성 함수
export const createPost = async (content, wantDeeper) => {
  try {
    const docRef = await addDoc(collection(db, 'posts'), {
      content: content,
      author: "익명",
      createdAt: serverTimestamp(),
      echoes: 0,
      wantDeeper: wantDeeper,
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
        wantDeeper: data.wantDeeper || false,
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

// 메아리 추가 함수
export const addEcho = async (postId, currentEchoes) => {
  try {
    const postRef = doc(db, 'posts', postId);
    await updateDoc(postRef, {
      echoes: currentEchoes + 1
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

export default db;
// 글 삭제 함수
export const deletePost = async (postId) => {
  try {
    await deleteDoc(doc(db, 'posts', postId));
    return { success: true };
  } catch (error) {
    console.error("글 삭제 오류:", error);
    return { success: false, error };
  }
};