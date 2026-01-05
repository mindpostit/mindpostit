import React, { useState, useEffect } from 'react';
import { getPosts } from './firebase';
import { deleteDoc, doc, getFirestore } from 'firebase/firestore';

const Admin = ({ onBack }) => {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [password, setPassword] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  const ADMIN_PASSWORD = 'mindpostit2024';

  useEffect(() => {
    if (isAuthenticated) {
      loadPosts();
    }
  }, [isAuthenticated]);

  const loadPosts = async () => {
    setLoading(true);
    const result = await getPosts();
    if (result.success) {
      setPosts(result.posts);
    }
    setLoading(false);
  };

  const handleLogin = () => {
    if (password === ADMIN_PASSWORD) {
      setIsAuthenticated(true);
    } else {
      alert('비밀번호가 틀렸습니다.');
    }
  };

  const handleDelete = async (postId) => {
    if (!window.confirm('정말 삭제하시겠습니까?')) return;

    try {
      const db = getFirestore();
      await deleteDoc(doc(db, 'posts', postId));
      alert('삭제되었습니다.');
      loadPosts();
    } catch (error) {
      console.error('삭제 실패:', error);
      alert('삭제에 실패했습니다.');
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full">
          <h1 className="text-2xl font-black text-gray-900 mb-6 text-center">
            🔒 관리자 로그인
          </h1>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleLogin()}
            placeholder="비밀번호 입력"
            className="w-full p-4 border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-400 mb-4"
          />
          <button
            onClick={handleLogin}
            className="w-full bg-gradient-to-r from-amber-500 to-orange-500 text-white py-3 rounded-xl hover:from-amber-600 hover:to-orange-600 transition-all font-bold"
          >
            로그인
          </button>
          <button
            onClick={onBack}
            className="w-full mt-3 text-gray-600 hover:text-gray-800 text-sm"
          >
            ← 돌아가기
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b-2 border-amber-200 sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-black text-gray-900">
              🛠️ 관리자 페이지
            </h1>
            <button
              onClick={onBack}
              className="text-gray-600 hover:text-gray-800 font-medium"
            >
              ← 돌아가기
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-8">
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-xl font-bold text-gray-900">
            전체 게시물 ({posts.length}개)
          </h2>
          <button
            onClick={loadPosts}
            className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-all font-medium"
          >
            🔄 새로고침
          </button>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-amber-500 border-t-transparent"></div>
            <p className="mt-4 text-gray-600">불러오는 중...</p>
          </div>
        ) : (
          <div className="space-y-4">
            {posts.map((post) => (
              <div
                key={post.id}
                className="bg-white rounded-xl p-6 shadow-md border-2 border-gray-200"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-sm font-bold text-gray-800">
                        {post.author}
                      </span>
                      <span className="text-xs text-gray-400">
                        ID: {post.id}
                      </span>
                      {post.wantDeeper && (
                        <span className="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded-full">
                          💬 더 듣고싶어요
                        </span>
                      )}
                    </div>
                    <p className="text-gray-900 mb-3 whitespace-pre-wrap">
                      {post.content}
                    </p>
                    <div className="flex items-center gap-4 text-sm text-gray-600">
                      <span>❤️ {post.echoes}개 메아리</span>
                      <span>💬 {post.comments?.length || 0}개 울림</span>
                    </div>
                  </div>
                  <button
                    onClick={() => handleDelete(post.id)}
                    className="bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 transition-all font-medium ml-4"
                  >
                    🗑️ 삭제
                  </button>
                </div>

                {post.comments && post.comments.length > 0 && (
                  <div className="mt-4 pt-4 border-t border-gray-200">
                    <p className="text-xs font-bold text-gray-600 mb-2">
                      댓글 {post.comments.length}개
                    </p>
                    <div className="space-y-2">
                      {post.comments.map((comment, idx) => (
                        <div
                          key={idx}
                          className="bg-gray-50 rounded-lg p-3 text-sm"
                        >
                          <span className="font-bold text-gray-700">
                            {comment.author}:
                          </span>{' '}
                          <span className="text-gray-600">
                            {comment.content}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

export default Admin;