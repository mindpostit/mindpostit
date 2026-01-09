import React, { useState, useEffect } from 'react';
import { getPosts, getTopics, createTopic, deleteTopic } from './firebase';
import { deleteDoc, doc, getFirestore } from 'firebase/firestore';

const Admin = ({ onBack }) => {
  const [posts, setPosts] = useState([]);
  const [topics, setTopics] = useState([]);
  const [loading, setLoading] = useState(true);
  const [password, setPassword] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [newTopic, setNewTopic] = useState('');
  const [showTopicForm, setShowTopicForm] = useState(false);

  const ADMIN_PASSWORD = 'mindpostit2024';

  useEffect(() => {
    if (isAuthenticated) {
      loadPosts();
      loadTopics();
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

  const loadTopics = async () => {
    const result = await getTopics();
    if (result.success) {
      setTopics(result.topics);
    }
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

  const handleAddTopic = async () => {
    if (!newTopic.trim()) {
      alert('주제를 입력해주세요.');
      return;
    }

    const result = await createTopic(newTopic);
    if (result.success) {
      alert('주제가 추가되었습니다.');
      setNewTopic('');
      setShowTopicForm(false);
      loadTopics();
    } else {
      alert('주제 추가에 실패했습니다.');
    }
  };

  const handleDeleteTopic = async (topicId) => {
    if (!window.confirm('정말 이 주제를 삭제하시겠습니까?')) return;

    const result = await deleteTopic(topicId);
    if (result.success) {
      alert('주제가 삭제되었습니다.');
      loadTopics();
    } else {
      alert('주제 삭제에 실패했습니다.');
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
        {/* 주제 관리 섹션 */}
        <div className="mb-8 bg-white rounded-xl p-6 shadow-md border-2 border-blue-200">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-gray-900">
              💭 주제 관리 ({topics.length}개)
            </h2>
            <button
              onClick={() => setShowTopicForm(!showTopicForm)}
              className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-all font-medium"
            >
              {showTopicForm ? '❌ 취소' : '➕ 주제 추가'}
            </button>
          </div>

          {showTopicForm && (
            <div className="mb-4 p-4 bg-blue-50 rounded-lg border-2 border-blue-300">
              <input
                type="text"
                value={newTopic}
                onChange={(e) => setNewTopic(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleAddTopic()}
                placeholder="새 주제 입력 (예: 오늘 기분은 어때요?)"
                className="w-full p-3 border-2 border-blue-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 mb-3"
              />
              <button
                onClick={handleAddTopic}
                className="w-full bg-blue-500 text-white py-2 rounded-lg hover:bg-blue-600 transition-all font-medium"
              >
                추가하기
              </button>
            </div>
          )}

          <div className="flex flex-wrap gap-2">
            {topics.length === 0 ? (
              <p className="text-gray-500 text-sm">등록된 주제가 없습니다.</p>
            ) : (
              topics.map((topic) => (
                <div
                  key={topic.id}
                  className="flex items-center gap-2 bg-blue-100 text-blue-800 px-4 py-2 rounded-full border-2 border-blue-300"
                >
                  <span className="font-medium">{topic.text}</span>
                  <button
                    onClick={() => handleDeleteTopic(topic.id)}
                    className="text-red-600 hover:text-red-800 font-bold"
                  >
                    ×
                  </button>
                </div>
              ))
            )}
          </div>
        </div>

        {/* 게시물 관리 섹션 */}
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
                      {post.topic && (
                        <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full">
                          💭 {post.topic}
                        </span>
                      )}
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