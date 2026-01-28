import React, { useState, useEffect } from 'react';
import { MessageCircle, Shield, StickyNote } from 'lucide-react';
import { createPost, getPosts, addEchoWithMessage, addComment, getTopics, getTodaysFeaturedPost, setTodaysFeaturedPost } from './firebase';
import Admin from './Admin';
import { validateContent } from './contentFilter';
import Terms from './Terms';

const App = () => {
  const [showTerms, setShowTerms] = useState(false);
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

  // 공감 메시지 목록
  const echoMessageOptions = [
    "공감함",
    "공감못함",
    "모르겠음"
  ];

  // eslint-disable-next-line react-hooks/exhaustive-deps
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
      
      // ✅ Featured post 자동 선정 (글이 있을 때만)
      if (filteredPosts.length > 0 && !featuredPostId) {
        const maxEchoes = Math.max(...filteredPosts.map(p => p.echoes || 0));
        const topPosts = filteredPosts.filter(p => (p.echoes || 0) === maxEchoes);
        const selectedPost = topPosts[Math.floor(Math.random() * topPosts.length)];
        
        await setTodaysFeaturedPost(selectedPost.id);
        setFeaturedPostId(selectedPost.id);
      }
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
          // 메아리가 가장 많은 값 찾기
          const maxEchoes = Math.max(...todaysPosts.map(p => p.echoes || 0));
          
          // 같은 메아리 수를 가진 글들만 필터링
          const topPosts = todaysPosts.filter(p => (p.echoes || 0) === maxEchoes);
          
          // 그 중에서 랜덤 선택
          const selectedPost = topPosts[Math.floor(Math.random() * topPosts.length)];
          
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
  
  // ✅ 여기에 Rate Limiting 추가
  const lastPostTime = localStorage.getItem('lastPostTime');
  const now = Date.now();
  const oneMinute = 60 * 1000;
  
  if (lastPostTime) {
    const timeSinceLastPost = now - parseInt(lastPostTime);
    if (timeSinceLastPost < oneMinute) {
      alert('너무 빨라! 1분에 한 번만 쓸 수 있어.');
      return;
    }
  }
  
  // 금칙어 검증
  const validation = validateContent(content);
  if (!validation.valid) {
    alert(validation.message);
    return;
  }
    
    setShowRipple(true);
    setTimeout(() => setShowRipple(false), 2000);
    
    const result = await createPost(content, false, selectedTopic); // wantDeeper 항상 false
    
    if (result.success) {
    // ✅ 여기에 시간 저장 추가
    localStorage.setItem('lastPostTime', now.toString());
    
    setContent('');
    setSelectedTopic(null);
    await loadPosts();
    setTimeout(() => setView('feed'), 500);
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
    
    // 금칙어 검증
    const validation = validateContent(commentText);
    if (!validation.valid) {
      alert(validation.message);
      return;
    }
    
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
    }
    
    const waves = Math.min(Math.floor(count / 5) + 1, 3);
    
    return (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={className}>
        <circle cx="12" cy="12" r="3" fill="currentColor"/>
        {waves >= 1 && (
          <circle cx="12" cy="12" r="6" opacity="0.6"/>
        )}
        {waves >= 2 && (
          <circle cx="12" cy="12" r="9" opacity="0.3"/>
        )}
        {waves >= 3 && (
          <circle cx="12" cy="12" r="11" opacity="0.15"/>
        )}
      </svg>
    );
  };

  const PostCard = ({ post, index, onClick, isFeatured = false }) => (
    <div
      onClick={onClick}
      className={`${postitColors[index % postitColors.length]} 
        ${isFeatured ? 'border-4 border-amber-400' : 'border-2'}
        rounded-lg p-4 md:p-6 cursor-pointer transition-all hover:shadow-lg hover:-translate-y-1
        relative overflow-hidden min-h-[180px] md:min-h-[220px]`}
      style={{
        boxShadow: isFeatured 
          ? '0 8px 24px rgba(251, 191, 36, 0.3)' 
          : '4px 4px 8px rgba(0,0,0,0.1)'
      }}
    >
      {isFeatured && (
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-amber-400 via-orange-400 to-amber-400"></div>
      )}
      
      <div className="relative z-10">
        {post.topic && (
          <span className="inline-block px-3 py-1 mb-3 text-xs font-bold rounded-full bg-amber-100 text-amber-700 border border-amber-200">
            {post.topic}
          </span>
        )}
        
        <p className="text-gray-900 mb-4 font-medium break-words whitespace-pre-wrap line-clamp-6">
          {post.content}
        </p>
        
        <div className="flex items-center justify-between text-xs text-gray-600 pt-3 border-t border-gray-200">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1">
              <span className="text-amber-600 font-semibold text-sm">
                <EchoIcon count={post.echoes || 0} className="inline text-amber-600" />
              </span>
              <span className="font-semibold text-gray-700">
                {post.echoes || 0}번의 메아리
              </span>
            </div>
            <div className="flex items-center gap-1">
              <MessageCircle size={14} className="text-gray-500" />
              <span>{post.comments?.length || 0}개의 울림</span>
            </div>
          </div>
          <span className="text-xs text-gray-500">{post.timeAgo}</span>
        </div>
      </div>
    </div>
  );

  const PostDetail = ({ post, onClose }) => {
    const [commentText, setCommentText] = useState('');
    
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 animate-fade-in"
           onClick={onClose}>
        <div className="bg-yellow-50 border-4 border-yellow-300 rounded-2xl p-6 md:p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto relative"
             onClick={(e) => e.stopPropagation()}
             style={{boxShadow: '12px 12px 24px rgba(0,0,0,0.2)'}}>
          
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-gray-600 hover:text-gray-900 text-2xl font-bold"
          >
            ×
          </button>
          
          {post.topic && (
            <span className="inline-block px-4 py-2 mb-4 text-sm font-bold rounded-full bg-amber-100 text-amber-700 border-2 border-amber-300">
              {post.topic}
            </span>
          )}
          
          <p className="text-gray-900 text-lg mb-6 font-medium whitespace-pre-wrap break-words">
            {post.content}
          </p>
          
          <div className="flex items-center gap-4 text-sm text-gray-600 mb-6 pb-6 border-b-2 border-yellow-300">
            <div className="flex items-center gap-2">
              <EchoIcon count={post.echoes || 0} className="text-amber-600" />
              <span className="font-semibold">{post.echoes || 0}번의 메아리</span>
            </div>
            <div className="flex items-center gap-2">
              <MessageCircle size={16} className="text-gray-500" />
              <span>{post.comments?.length || 0}개의 울림</span>
            </div>
            <span className="ml-auto text-gray-500">{post.timeAgo}</span>
          </div>

          <div className="mb-6">
            <h3 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
              <span className="text-amber-600">
                <EchoIcon count={post.echoes || 0} />
              </span>
              메아리 보내기
            </h3>
            <div className="flex flex-wrap gap-2 mb-4">
              {echoMessageOptions.map(message => {
                const count = post.echoMessages?.[message] || 0;
                return (
                  <button
                    key={message}
                    onClick={() => handleEchoWithMessage(message)}
                    className="px-4 py-2 rounded-full font-medium transition-all border-2 border-amber-300 bg-white hover:bg-amber-50 hover:border-amber-400 hover:shadow-md"
                  >
                    {message} {count > 0 && <span className="text-amber-600 font-bold">({count})</span>}
                  </button>
                );
              })}
            </div>
          </div>
          
          <div className="mb-6">
            <h3 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
              <MessageCircle size={20} className="text-gray-700" />
              울림 ({post.comments?.length || 0})
            </h3>
            <div className="space-y-3 mb-4 max-h-60 overflow-y-auto">
              {post.comments?.map((comment) => (
                <div key={comment.id} className="bg-white/60 rounded-lg p-3 border border-gray-200">
                  <p className="text-gray-900 text-sm mb-1 whitespace-pre-wrap break-words">{comment.text}</p>
                  <div className="flex items-center justify-between text-xs text-gray-500">
                    <span className="font-medium">{comment.isAnonymous ? '익명' : '들림이'}</span>
                    <span>{getTimeAgo(comment.timestamp)}</span>
                  </div>
                </div>
              ))}
            </div>
            
            <div className="flex gap-2">
              <input
                type="text"
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === 'Enter' && commentText.trim()) {
                    handleAddComment(post.id, commentText);
                    setCommentText('');
                  }
                }}
                placeholder="울림을 남겨봐 (익명)"
                className="flex-1 px-4 py-2 border-2 border-yellow-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-400 bg-yellow-50"
              />
              <button
                onClick={() => {
                  if (commentText.trim()) {
                    handleAddComment(post.id, commentText);
                    setCommentText('');
                  }
                }}
                disabled={!commentText.trim()}
                className="px-6 py-2 bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-lg hover:from-amber-600 hover:to-orange-600 disabled:from-gray-300 disabled:to-gray-400 disabled:cursor-not-allowed font-bold transition-all"
              >
                보내기
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const EchoModal = ({ isOpen, onClose, onSelectMessage, post }) => {
    if (!isOpen || !post) return null;

    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50"
           onClick={onClose}>
        <div className="bg-white rounded-2xl p-6 max-w-md w-full"
             onClick={(e) => e.stopPropagation()}>
          <h3 className="text-xl font-bold mb-4 text-gray-900">메아리 보내기</h3>
          <p className="text-sm text-gray-600 mb-6">이 마음에 공감하시나요?</p>
          
          <div className="space-y-3">
            {echoMessageOptions.map(message => {
              const count = post.echoMessages?.[message] || 0;
              return (
                <button
                  key={message}
                  onClick={() => onSelectMessage(message)}
                  className="w-full px-4 py-3 rounded-lg font-medium transition-all border-2 border-gray-200 bg-white hover:bg-amber-50 hover:border-amber-400 text-left flex justify-between items-center"
                >
                  <span>{message}</span>
                  {count > 0 && <span className="text-amber-600 font-bold">({count})</span>}
                </button>
              );
            })}
          </div>
          
          <button
            onClick={onClose}
            className="w-full mt-4 px-4 py-2 text-gray-600 hover:text-gray-900 font-medium"
          >
            취소
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-yellow-50 to-orange-50 relative overflow-hidden">
      <div className="absolute inset-0 opacity-30">
        <div className="absolute top-10 left-10 w-32 h-32 bg-yellow-200 rounded-full blur-3xl animate-pulse-slow"></div>
        <div className="absolute top-40 right-20 w-48 h-48 bg-amber-200 rounded-full blur-3xl animate-pulse-slow" style={{animationDelay: '1s'}}></div>
        <div className="absolute bottom-20 left-1/3 w-40 h-40 bg-orange-200 rounded-full blur-3xl animate-pulse-slow" style={{animationDelay: '2s'}}></div>
      </div>

      {showAdmin && <Admin onClose={() => setShowAdmin(false)} />}
      
      <EchoModal 
        isOpen={showEchoModal}
        onClose={() => {
          setShowEchoModal(false);
          setEchoingPost(null);
        }}
        onSelectMessage={handleEchoWithMessage}
        post={echoingPost}
      />

      <header className="bg-white/80 backdrop-blur-sm border-b-4 border-amber-300 sticky top-0 z-40 shadow-md">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div 
              className="flex items-center gap-3 cursor-pointer group"
              onClick={() => setView('feed')}
            >
              <div className="bg-gradient-to-br from-amber-400 to-orange-400 p-3 rounded-xl shadow-lg group-hover:shadow-xl transition-all group-hover:scale-105">
                <StickyNote className="text-white" size={28} />
              </div>
              <div>
                <h1 className="text-2xl md:text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-amber-600 to-orange-600">
                  마인드포스팃
                </h1>
                <p className="text-xs md:text-sm text-gray-600 font-medium">오늘 다 뱉음, 내일은 가벼움</p>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <button
                onClick={() => setView('write')}
                className="bg-gradient-to-r from-amber-500 to-orange-500 text-white px-4 md:px-6 py-2 md:py-3 rounded-full hover:from-amber-600 hover:to-orange-600 transition-all font-black text-sm md:text-base shadow-md hover:shadow-lg flex items-center gap-2"
              >
                <StickyNote size={18} />
                <span className="hidden md:inline">마음 남기기</span>
                <span className="md:hidden">글쓰기</span>
              </button>
              
              <button
                onClick={() => setShowAdmin(true)}
                className="p-2 md:p-3 rounded-full bg-white/80 hover:bg-gray-100 transition-all border-2 border-gray-200 hover:border-gray-300"
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

      {/* Footer */}
      <footer className="bg-white/80 backdrop-blur-sm border-t border-gray-200 py-4 mt-12">
        <div className="max-w-6xl mx-auto px-4 text-center">
          <button
            onClick={() => setShowTerms(true)}
            className="text-sm text-gray-600 hover:text-amber-600 transition-colors underline"
          >
            이용약관
          </button>
          <p className="text-xs text-gray-500 mt-2">© 2026 마인드포스팃. 24시간 후 사라지는 익명 감정 공유</p>
        </div>
      </footer>

      {/* Terms Modal */}
      {showTerms && <Terms onClose={() => setShowTerms(false)} />}

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