import React, { useState, useEffect } from 'react';
import { MessageCircle, Shield } from 'lucide-react';
import { createPost, getPosts, addEchoWithMessage, addComment, getTopics, getTodaysFeaturedPost, setTodaysFeaturedPost } from './firebase';
import Admin from './Admin';

const App = () => {
  const [view, setView] = useState('feed');
  const [showAdmin, setShowAdmin] = useState(false);
  const [sortBy, setSortBy] = useState('최신순');
  const [posts, setPosts] = useState([]);
  const [topics, setTopics] = useState([]);
  const [featuredPostId, setFeaturedPostId] = useState(null);
  const [loading, setLoading] = useState(true);
  
  const [selectedPost, setSelectedPost] = useState(null);
  const [showRipple, setShowRipple] = useState(false);
  const [showEchoModal, setShowEchoModal] = useState(false);
  const [echoingPost, setEchoingPost] = useState(null);
  
  const [content, setContent] = useState('');
  const [selectedTopic, setSelectedTopic] = useState(null);
  const [wantDeeper, setWantDeeper] = useState(false);
  const [listenWithComments, setListenWithComments] = useState(true);

  // 공감 메시지 목록
  const echoMessageOptions = [
    "공감함",
    "공감못함",
    "모르겠음"
  ];

  useEffect(() => {
    loadPosts();
    loadTopics();
    loadAndSelectFeaturedPost();
  }, []);

  const loadPosts = async () => {
    setLoading(true);
    const result = await getPosts();
    if (result.success) {
      // 24시간 지난 글 필터링 (자정 기준)
      const now = new Date();
      const todayMidnight = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0);
      
      const filteredPosts = result.posts.filter(post => {
        if (!post.createdAt) return true;
        
        const postDate = post.createdAt.toDate ? post.createdAt.toDate() : new Date(post.createdAt);
        const postMidnight = new Date(postDate.getFullYear(), postDate.getMonth(), postDate.getDate(), 0, 0, 0);
        
        // 오늘 자정과 글 작성일의 자정을 비교
        return postMidnight.getTime() === todayMidnight.getTime();
      });
      
      setPosts(filteredPosts.map((post, index) => ({
        ...post,
        timeAgo: getTimeAgo(post.createdAt)
      })));
    }
    setLoading(false);
  };

  const loadTopics = async () => {
    const result = await getTopics();
    if (result.success) {
      setTopics(result.topics);
    }
  };

  const loadAndSelectFeaturedPost = async () => {
    // 오늘의 포스트잇 확인
    const featured = await getTodaysFeaturedPost();
    
    if (featured.success && featured.featured) {
      // 이미 오늘 선정된 게 있으면 사용
      setFeaturedPostId(featured.featured.postId);
    } else {
      // 없으면 자동 선정 (메아리가 가장 많은 글)
      const result = await getPosts();
      if (result.success && result.posts.length > 0) {
        // 오늘 작성된 글 중 메아리가 가장 많은 글 선정
        const today = new Date();
        const todayMidnight = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 0, 0, 0);
        
        const todaysPosts = result.posts.filter(post => {
          if (!post.createdAt) return false;
          const postDate = post.createdAt.toDate ? post.createdAt.toDate() : new Date(post.createdAt);
          const postMidnight = new Date(postDate.getFullYear(), postDate.getMonth(), postDate.getDate(), 0, 0, 0);
          return postMidnight.getTime() === todayMidnight.getTime();
        });
        
        if (todaysPosts.length > 0) {
          // 메아리가 가장 많은 글 선정
          const sortedByEchoes = [...todaysPosts].sort((a, b) => (b.echoes || 0) - (a.echoes || 0));
          const selectedPost = sortedByEchoes[0];
          
          await setTodaysFeaturedPost(selectedPost.id);
          setFeaturedPostId(selectedPost.id);
        }
      }
    }
  };

  const getTimeAgo = (timestamp) => {
    if (!timestamp) return '방금';
    const now = new Date();
    const posted = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    const diff = Math.floor((now - posted) / 1000);
    
    if (diff < 60) return '방금';
    if (diff < 3600) return `${Math.floor(diff / 60)}분 전`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}시간 전`;
    return `${Math.floor(diff / 86400)}일 전`;
  };

  const postitColors = [
    'bg-stone-50 border-stone-200',
    'bg-stone-50 border-stone-200',
    'bg-stone-50 border-stone-200',
    'bg-stone-50 border-stone-200',
    'bg-stone-50 border-stone-200'
  ];

  const handleSubmit = async () => {
    if (!content.trim()) return;
    
    setShowRipple(true);
    setTimeout(() => setShowRipple(false), 2000);
    
    const result = await createPost(content, false, selectedTopic); // wantDeeper 항상 false
    
    if (result.success) {
      const postContent = content;
      
      setContent('');
      setSelectedTopic(null);
      setWantDeeper(false);
      setListenWithComments(true);
      
      await loadPosts();
      
      setTimeout(() => setView('feed'), 500);
      
      // AI 제거 - 사람끼리만 소통
    } else {
      alert('글 작성에 실패했습니다. 다시 시도해주세요.');
    }
  };

  const handleEchoClick = (post) => {
    setEchoingPost(post);
    setShowEchoModal(true);
  };

  const handleEchoWithMessage = async (message) => {
    if (!echoingPost) return;
    
    const result = await addEchoWithMessage(
      echoingPost.id, 
      message, 
      echoingPost.echoMessages || {}
    );
    
    if (result.success) {
      // 로컬 상태 업데이트
      const updatedMessages = { ...echoingPost.echoMessages };
      updatedMessages[message] = (updatedMessages[message] || 0) + 1;
      const totalEchoes = Object.values(updatedMessages).reduce((sum, count) => sum + count, 0);
      
      setPosts(posts.map(post => 
        post.id === echoingPost.id 
          ? { ...post, echoes: totalEchoes, echoMessages: updatedMessages } 
          : post
      ));
      
      if (selectedPost && selectedPost.id === echoingPost.id) {
        setSelectedPost({ 
          ...selectedPost, 
          echoes: totalEchoes, 
          echoMessages: updatedMessages 
        });
      }
    }
    
    setShowEchoModal(false);
    setEchoingPost(null);
  };

  const handleAddComment = async (postId, commentText) => {
    if (!commentText.trim()) return;
    
    const post = posts.find(p => p.id === postId);
    
    const result = await addComment(postId, commentText, post.comments);
    
    if (result.success) {
      const updatedPosts = posts.map(p => 
        p.id === postId 
          ? { ...p, comments: [...p.comments, result.comment] }
          : p
      );
      setPosts(updatedPosts);
      
      if (selectedPost && selectedPost.id === postId) {
        setSelectedPost({
          ...selectedPost,
          comments: [...selectedPost.comments, result.comment]
        });
      }
      
      // AI 응답 제거 - 사람끼리만 대화
    }
  };

  // 3턴 대화 계속하기
  const sortedPosts = [...posts].sort((a, b) => {
    if (sortBy === '최신순') {
      return 0;
    } else {
      return b.echoes - a.echoes;
    }
  });

  const EchoIcon = ({ count = 0, className = "" }) => {
    if (count === 0) {
      return (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={className}>
          <circle cx="12" cy="12" r="3" fill="currentColor"/>
        </svg>
      );
    } else if (count <= 3) {
      return (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={className}>
          <circle cx="12" cy="12" r="7" opacity="0.5"/>
          <circle cx="12" cy="12" r="3" fill="currentColor"/>
        </svg>
      );
    } else if (count <= 10) {
      return (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={className}>
          <circle cx="12" cy="12" r="10" opacity="0.3"/>
          <circle cx="12" cy="12" r="7" opacity="0.5"/>
          <circle cx="12" cy="12" r="3" fill="currentColor"/>
        </svg>
      );
    } else {
      return (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={`${className} animate-pulse`}>
          <circle cx="12" cy="12" r="10" opacity="0.3"/>
          <circle cx="12" cy="12" r="7" opacity="0.5"/>
          <circle cx="12" cy="12" r="3" fill="currentColor"/>
        </svg>
      );
    }
  };

  const PostCard = ({ post, onClick, index, isFeatured = false }) => {
    const colorClass = isFeatured 
      ? 'bg-gradient-to-br from-amber-100 via-yellow-100 to-orange-100 border-amber-400' 
      : postitColors[index % postitColors.length];
    
    return (
      <div 
        onClick={onClick}
        className={`${colorClass} rounded-lg p-5 shadow-md hover:shadow-xl hover:scale-105 transition-all duration-300 cursor-pointer border-2 relative group ${isFeatured ? 'ring-4 ring-amber-400 ring-opacity-50' : ''}`}
        style={{
          boxShadow: isFeatured ? '8px 8px 20px rgba(251, 191, 36, 0.3)' : '4px 4px 8px rgba(0,0,0,0.1)',
        }}
      >
        <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 w-16 h-6 bg-white/40 rounded-sm" 
             style={{boxShadow: '0 1px 3px rgba(0,0,0,0.1)'}}/>
        
        <div className="relative z-10">
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold text-gray-800">{post.author}</span>
              <span className="text-xs text-gray-500">•</span>
              <span className="text-xs text-gray-500">{post.timeAgo}</span>
            </div>
            <div className="flex items-center gap-2">
              {post.topic && (
                <div className="flex items-center gap-1 text-xs text-blue-700 bg-white/60 px-2 py-0.5 rounded-full border border-blue-300">
                  <span>💭 {post.topic}</span>
                </div>
              )}
              {post.wantDeeper && (
                <div className="flex items-center gap-1 text-xs text-purple-700 bg-white/60 px-2 py-0.5 rounded-full border border-purple-300">
                  <span>🔮 깊게 들어줘</span>
                </div>
              )}
            </div>
          </div>
          
          <p className="text-gray-900 mb-4 line-clamp-3 font-medium leading-relaxed">{post.content}</p>
          
          <div className="flex items-center gap-4 text-sm text-gray-700">
            <button 
              onClick={(e) => {
                e.stopPropagation();
                handleEchoClick(post);
              }}
              className="flex items-center gap-1.5 hover:text-purple-600 transition-colors group/echo"
            >
              <div className="relative">
                <EchoIcon count={post.echoes} />
                <div className="absolute inset-0 scale-0 group-hover/echo:scale-150 opacity-0 group-hover/echo:opacity-30 transition-all duration-500">
                  <EchoIcon count={post.echoes} />
                </div>
              </div>
              <span className="font-bold">{post.echoes}번의 메아리</span>
            </button>
            
            <div className="flex items-center gap-1.5">
              <MessageCircle size={18} />
              <span className="font-bold">{post.comments?.length || 0}개의 울림</span>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const PostDetail = ({ post, onClose }) => {
    const [localComment, setLocalComment] = useState('');
    
    const handleSubmitComment = () => {
      if (localComment.trim()) {
        handleAddComment(post.id, localComment);
        setLocalComment('');
      }
    };
    
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
          <div className="sticky top-0 bg-white border-b border-gray-100 p-4 md:p-6 z-10">
            <button 
              onClick={onClose}
              className="flex items-center gap-2 text-gray-600 hover:text-gray-900 text-base font-medium bg-gray-100 hover:bg-gray-200 px-4 py-2 rounded-lg transition-all"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M19 12H5M12 19l-7-7 7-7"/>
              </svg>
              돌아가기
            </button>
          </div>
          
          <div className="p-4 md:p-6">
            <div className="flex items-center gap-2 mb-4">
              <span className="text-sm font-bold text-gray-800">{post.author}</span>
              <span className="text-xs text-gray-400">•</span>
              <span className="text-xs text-gray-400">{post.timeAgo}</span>
              {post.topic && (
                <div className="flex items-center gap-1 text-xs text-blue-700 bg-blue-50 px-2 py-1 rounded-full ml-2 border border-blue-200">
                  <span>💭 {post.topic}</span>
                </div>
              )}
              {post.wantDeeper && (
                <div className="flex items-center gap-1 text-xs text-purple-700 bg-purple-50 px-2 py-1 rounded-full ml-2 border border-purple-200">
                  <span>🔮 깊게 들어줘</span>
                </div>
              )}
            </div>
            
            <p className="text-gray-900 mb-6 whitespace-pre-wrap leading-relaxed font-medium">{post.content}</p>
            
            <div className="mb-6 pb-6 border-b">
              <button 
                onClick={() => handleEchoClick(post)}
                className="flex items-center gap-1.5 hover:text-purple-600 transition-colors mb-3"
              >
                <EchoIcon count={post.echoes} />
                <span className="font-bold text-sm text-gray-700">{post.echoes}번의 메아리</span>
              </button>
              
              {/* 공감 메시지 상세 표시 */}
              {post.echoMessages && Object.keys(post.echoMessages).length > 0 && (
                <div className="space-y-2 mt-3">
                  {Object.entries(post.echoMessages)
                    .sort((a, b) => b[1] - a[1]) // 많은 순으로 정렬
                    .map(([msg, count]) => (
                      <div key={msg} className="flex items-center justify-between bg-purple-50 rounded-lg px-4 py-2 border border-purple-200">
                        <span className="text-sm font-bold text-gray-800">{msg}</span>
                        <span className="text-xs bg-purple-200 text-purple-800 px-3 py-1 rounded-full font-bold">
                          {count}명
                        </span>
                      </div>
                    ))}
                </div>
              )}
            </div>
            
            <div className="mb-4">
              <h3 className="text-sm font-bold text-gray-800 mb-3 flex items-center gap-2">
                <MessageCircle size={16} className="text-purple-600" />
                울림 {post.comments?.length || 0}개
              </h3>
            </div>
            
            <div className="space-y-3 mb-6">
              {(post.comments || []).map((comment, idx) => (
                <div key={idx} className="bg-gradient-to-br from-purple-50 to-blue-50 rounded-xl p-4 border border-purple-100">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-sm font-bold text-gray-800">{comment.author}</span>
                    <span className="text-xs text-gray-400">•</span>
                    <span className="text-xs text-gray-400">
                      {comment.time || getTimeAgo(comment.createdAt)}
                    </span>
                  </div>
                  <p className="text-gray-800 text-sm leading-relaxed">{comment.content}</p>
                </div>
              ))}
            </div>
            
            <div className="space-y-3">
              <label className="block text-sm font-bold text-gray-800">울림 남기기</label>
              <textarea
                value={localComment}
                onChange={(e) => setLocalComment(e.target.value)}
                placeholder="당신의 울림을 남겨주세요..."
                className="w-full p-4 border-2 border-purple-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-400 resize-none bg-yellow-50"
                rows="3"
              />
              <button
                onClick={handleSubmitComment}
                className="w-full bg-gradient-to-r from-purple-500 to-blue-500 text-white py-3 rounded-xl hover:from-purple-600 hover:to-blue-600 transition-all font-bold shadow-md"
              >
                울림 보내기
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  if (showAdmin) {
    return <Admin onBack={() => setShowAdmin(false)} />;
  }

  return (
    <div className="min-h-screen bg-white relative overflow-hidden">
      {/* 공감 메시지 선택 모달 */}
      {showEchoModal && (
        <div 
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
          onClick={() => setShowEchoModal(false)}
        >
          <div 
            className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-xl font-black text-gray-900 mb-4 text-center">
              공감을 남겨주세요 💜
            </h3>
            <div className="space-y-2">
              {echoMessageOptions.map((message) => (
                <button
                  key={message}
                  onClick={() => handleEchoWithMessage(message)}
                  className="w-full bg-gradient-to-r from-purple-50 to-blue-50 hover:from-purple-100 hover:to-blue-100 text-gray-900 py-3 rounded-xl transition-all font-bold border-2 border-purple-200 hover:border-purple-400 hover:scale-105"
                >
                  {message}
                </button>
              ))}
            </div>
            <button
              onClick={() => setShowEchoModal(false)}
              className="w-full mt-4 text-gray-600 hover:text-gray-800 text-sm font-medium"
            >
              취소
            </button>
          </div>
        </div>
      )}
      <div className="fixed inset-0 pointer-events-none opacity-20">
        <svg className="absolute top-20 left-10 w-64 h-64 animate-pulse-slow">
          <circle cx="128" cy="128" r="100" fill="none" stroke="#f59e0b" strokeWidth="1"/>
          <circle cx="128" cy="128" r="70" fill="none" stroke="#f59e0b" strokeWidth="1"/>
          <circle cx="128" cy="128" r="40" fill="none" stroke="#f59e0b" strokeWidth="1"/>
        </svg>
        <svg className="absolute bottom-20 right-10 w-96 h-96 animate-pulse-slow" style={{animationDelay: '1s'}}>
          <circle cx="192" cy="192" r="150" fill="none" stroke="#fbbf24" strokeWidth="1"/>
          <circle cx="192" cy="192" r="110" fill="none" stroke="#fbbf24" strokeWidth="1"/>
          <circle cx="192" cy="192" r="70" fill="none" stroke="#fbbf24" strokeWidth="1"/>
        </svg>
      </div>

      {showRipple && (
        <div className="fixed inset-0 pointer-events-none z-50 flex items-center justify-center">
          <div className="relative w-96 h-96">
            <div className="absolute inset-0 rounded-full bg-yellow-400 opacity-30 animate-ripple-out"/>
            <div className="absolute inset-0 rounded-full bg-orange-400 opacity-20 animate-ripple-out" style={{animationDelay: '0.3s'}}/>
            <div className="absolute inset-0 rounded-full bg-amber-400 opacity-10 animate-ripple-out" style={{animationDelay: '0.6s'}}/>
          </div>
        </div>
      )}

      <header className={`bg-white/90 backdrop-blur-sm shadow-sm sticky top-0 z-40 border-b-2 border-yellow-200 transition-all ${selectedPost ? 'hidden' : ''}`}>
        <div className="max-w-6xl mx-auto px-4 py-3 md:py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 md:gap-3">
              <div className="relative">
                <EchoIcon count={5} />
                <div className="absolute inset-0 animate-ping opacity-20">
                  <EchoIcon count={5} />
                </div>
              </div>
              <div 
                className="cursor-pointer"
                onClick={() => setView('feed')}
              >
                <h1 className="text-xl md:text-2xl font-black bg-gradient-to-r from-amber-600 to-orange-600 bg-clip-text text-transparent">
                  마인드포스팃
                </h1>
                <p className="text-[10px] md:text-xs text-gray-600 font-medium">메아리가 되어 돌아오는 마음</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setView(view === 'feed' ? 'write' : 'feed')}
                className="bg-gradient-to-r from-amber-500 to-orange-500 text-white px-4 md:px-6 py-2 md:py-2.5 rounded-full hover:from-amber-600 hover:to-orange-600 transition-all font-bold shadow-md hover:shadow-lg text-sm md:text-base"
              >
                {view === 'feed' ? '📝 마음 남기기' : '📋 메아리 보기'}
              </button>
              <button
                onClick={() => setShowAdmin(true)}
                className="p-2 text-gray-600 hover:text-amber-600 transition-all"
                title="관리자"
              >
                <Shield size={20} />
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-6 md:py-8 relative z-10">
        {view === 'feed' ? (
          <>
            <div className="mb-6 flex justify-center">
              <div className="inline-flex bg-white/90 backdrop-blur-sm rounded-full p-1 shadow-md border-2 border-yellow-200">
                {['최신순', '메아리순'].map((sortOption) => (
                  <button
                    key={sortOption}
                    onClick={() => setSortBy(sortOption)}
                    className={`px-4 md:px-6 py-2 rounded-full text-xs md:text-sm font-bold transition-all ${
                      sortBy === sortOption
                        ? 'bg-gradient-to-r from-amber-400 to-orange-400 text-white shadow-md'
                        : 'text-gray-700 hover:text-gray-900'
                    }`}
                  >
                    {sortOption}
                  </button>
                ))}
              </div>
            </div>

            <div className="mb-8">
              <div className="text-center mb-6 md:mb-8">
                <h2 className="text-xl md:text-2xl font-black text-gray-900 mb-2">울려퍼진 마음들</h2>
                <p className="text-sm md:text-base text-gray-700 font-medium">욕도, 지껄임도 모든 OK</p>
                <p className="text-xs text-amber-600 font-bold mt-2">⏰ 내일 자정에 흔적 없이 사라짐</p>
              </div>
              
              {loading ? (
                <div className="text-center py-12">
                  <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-amber-500 border-t-transparent"></div>
                  <p className="mt-4 text-gray-600">마음들을 불러오고 있어요...</p>
                </div>
              ) : posts.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-gray-600 mb-4">아직 마음이 남겨지지 않았어요</p>
                  <button
                    onClick={() => setView('write')}
                    className="bg-gradient-to-r from-amber-500 to-orange-500 text-white px-6 py-3 rounded-full hover:from-amber-600 hover:to-orange-600 transition-all font-bold shadow-md"
                  >
                    첫 번째 마음 남기기
                  </button>
                </div>
              ) : (
                <>
                  {/* 오늘의 포스트잇 */}
                  {featuredPostId && sortedPosts.find(p => p.id === featuredPostId) && (
                    <div className="mb-8">
                      <div className="text-center mb-4">
                        <h3 className="text-lg md:text-xl font-black text-amber-600 mb-1">
                          📌 오늘의 포스팃
                        </h3>
                      </div>
                      <div className="max-w-2xl mx-auto">
                        <PostCard 
                          post={sortedPosts.find(p => p.id === featuredPostId)}
                          index={-1}
                          onClick={() => setSelectedPost(sortedPosts.find(p => p.id === featuredPostId))}
                          isFeatured={true}
                        />
                      </div>
                    </div>
                  )}
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
                    {sortedPosts.filter(post => post.id !== featuredPostId).map((post, index) => (
                      <PostCard 
                        key={post.id} 
                        post={post}
                        index={index}
                        onClick={() => setSelectedPost(post)}
                      />
                    ))}
                  </div>
                </>
              )}
            </div>
            
            {selectedPost && (
              <PostDetail 
                post={selectedPost} 
                onClose={() => {
                  setSelectedPost(null);
                }}
              />
            )}
          </>
        ) : (
          <div className="max-w-2xl mx-auto">
            <div className="bg-yellow-100 border-2 border-yellow-300 rounded-2xl p-6 md:p-8 shadow-xl relative"
                 style={{boxShadow: '8px 8px 16px rgba(0,0,0,0.15)'}}>
              <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 w-20 h-8 bg-white/50 rounded-sm" 
                   style={{boxShadow: '0 2px 4px rgba(0,0,0,0.1)'}}/>
              
              <div className="text-center mb-6">
                <h2 className="text-xl md:text-2xl font-black text-gray-900 mb-2">맘대로 써!</h2>
                <p className="text-sm md:text-base text-gray-700 font-medium">X발이라고 써도 돼. 24시간 후 사라지니까.</p>
              </div>
              
              {/* 주제 선택 */}
              {topics.length > 0 && (
                <div className="mb-5">
                  <label className="block text-sm font-bold text-gray-900 mb-3">
                    💭 오늘의 주제를 선택해봐 (선택사항)
                  </label>
                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={() => setSelectedTopic(null)}
                      className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                        selectedTopic === null
                          ? 'bg-gradient-to-r from-amber-400 to-orange-400 text-white shadow-md'
                          : 'bg-white/60 text-gray-700 hover:bg-white border-2 border-gray-300'
                      }`}
                    >
                      자유 주제
                    </button>
                    {topics.map((topic) => (
                      <button
                        key={topic.id}
                        onClick={() => setSelectedTopic(topic.text)}
                        className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                          selectedTopic === topic.text
                            ? 'bg-gradient-to-r from-amber-400 to-orange-400 text-white shadow-md'
                            : 'bg-white/60 text-gray-700 hover:bg-white border-2 border-gray-300'
                        }`}
                      >
                        {topic.text}
                      </button>
                    ))}
                  </div>
                </div>
              )}
              
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder={selectedTopic ? `"${selectedTopic}"에 대해 솔직하게..` : "진짜 솔직하게 써봐. 욕도 괜찮아."}
                className="w-full p-4 md:p-5 border-2 border-yellow-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-transparent mb-5 resize-none bg-yellow-50 font-medium text-gray-900 placeholder-gray-500"
                rows="8"
              />
              
              
              <button
                onClick={handleSubmit}
                disabled={!content.trim()}
                className="w-full bg-gradient-to-r from-amber-500 to-orange-500 text-white py-3 md:py-4 rounded-xl hover:from-amber-600 hover:to-orange-600 disabled:from-gray-300 disabled:to-gray-400 disabled:cursor-not-allowed transition-all font-black text-base md:text-lg shadow-lg hover:shadow-xl"
              >
                털어놓기
              </button>
              <div className="text-center mt-3 space-y-1">
                <p className="text-xs md:text-sm text-gray-600 font-medium">아무도 몰라. 완전 익명.</p>
                <p className="text-xs text-amber-600 font-bold">⏰ 내일 자정에 흔적 없이 사라짐</p>
              </div>
            </div>
          </div>
        )}
      </main>

      <style>{`
        @keyframes ripple-out {
          0% { transform: scale(0); opacity: 0.6; }
          100% { transform: scale(4); opacity: 0; }
        }
        
        @keyframes pulse-slow {
          0%, 100% { opacity: 0.2; transform: scale(1); }
          50% { opacity: 0.3; transform: scale(1.05); }
        }
        
        .animate-ripple-out {
          animation: ripple-out 2s ease-out forwards;
        }
        
        .animate-pulse-slow {
          animation: pulse-slow 4s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
};

export default App;
