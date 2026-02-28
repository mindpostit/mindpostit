import React, { useState, useEffect } from 'react';
import { MessageCircle, Shield, StickyNote } from 'lucide-react';
import { createPost, getPosts, addEchoWithMessage, addComment, getTopics, getTodaysFeaturedPost, setTodaysFeaturedPost } from './firebase';
import { analytics } from './firebase';
import { logEvent } from 'firebase/analytics';
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
  const [onlineCount, setOnlineCount] = useState(0);
  
  const [selectedPost, setSelectedPost] = useState(null);
  const [showRipple, setShowRipple] = useState(false);
  const [showEchoModal, setShowEchoModal] = useState(false);
  const [echoingPost, setEchoingPost] = useState(null);
  
  const [content, setContent] = useState('');
  const [selectedTopic, setSelectedTopic] = useState(null);

  // 공감 메시지 목록
  const echoMessageOptions = [
    { emoji: "🕯️", label: "읽었어요", desc: "여기 있었어요" },
    { emoji: "💛", label: "나도요", desc: "같은 마음이에요" },
    { emoji: "🌙", label: "괜찮아요", desc: "들었어요, 수고했어요" },
  ];

  // 시간대별 자연스러운 접속자 수 생성
  const getOnlineCount = () => {
    const hour = new Date().getHours();
    let min, max;
    if (hour >= 0 && hour < 3)       { min = 8;  max = 18; }  // 자정~새벽3시 (피크)
    else if (hour >= 3 && hour < 6)  { min = 4;  max = 10; }  // 새벽3~6시
    else if (hour >= 6 && hour < 10) { min = 2;  max = 6;  }  // 아침
    else if (hour >= 10 && hour < 22){ min = 3;  max = 8;  }  // 낮
    else                              { min = 6;  max = 15; }  // 밤10시~자정
    return Math.floor(Math.random() * (max - min + 1)) + min;
  };

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    loadPosts();
    loadTopics();
    loadAndSelectFeaturedPost();
    setOnlineCount(getOnlineCount());
    // 3~5분마다 접속자 수 자연스럽게 변동
    const interval = setInterval(() => {
      setOnlineCount(getOnlineCount());
    }, (Math.random() * 2 + 3) * 60 * 1000);
    return () => clearInterval(interval);
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
    { bg: '#FFF9C4', border: '#F0E68C', tape: '#F5E642' },  // 연노랑
    { bg: '#FFE4E8', border: '#FFB3C1', tape: '#FF8FA3' },  // 연핑크
    { bg: '#E8F5E9', border: '#B2DFDB', tape: '#80CBC4' },  // 연민트
    { bg: '#EDE7F6', border: '#D1C4E9', tape: '#B39DDB' },  // 연보라
    { bg: '#FFF3E0', border: '#FFE0B2', tape: '#FFCC80' },  // 연주황
    { bg: '#E3F2FD', border: '#BBDEFB', tape: '#90CAF9' },  // 연파랑
  ];

  // 카드별 고정 랜덤값 (리렌더 시 안 바뀌게 post.id 기반)
  const getCardMeta = (postId) => {
    const hash = postId ? postId.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0) : 0;
    const colorIdx = hash % postitColors.length;
    const rotation = ((hash % 5) - 2) * 0.8; // -1.6 ~ 1.6도
    return { color: postitColors[colorIdx], rotation };
  };

  const handleSubmit = async () => {
  if (!content.trim()) return;
  
  // ✅ 여기에 Rate Limiting 추가
  const lastPostTime = localStorage.getItem('lastPostTime');
  const now = Date.now();
  const oneMinute = 60 * 1000;
  
  if (lastPostTime) {
    const timeSinceLastPost = now - parseInt(lastPostTime);
    if (timeSinceLastPost < oneMinute) {
      alert('잠깐요! 1분에 한 번만 남길 수 있어요.');
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
    // logEvent(analytics, 'post_created', { has_topic: selectedTopic ? true : false });
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
    logEvent(analytics, 'echo_added', { echo_type: message });
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

  const getPlaceholder = () => {
    const hour = new Date().getHours();
    if (selectedTopic) return `"${selectedTopic}"에 대해 느낌을 남겨보세요`;
    if (hour >= 0 && hour < 3)  return "새벽엔 별 생각이 다 들죠";
    if (hour >= 3 && hour < 6)  return "아직 안 자고 있어요?";
    if (hour >= 22)              return "오늘 하루 어땠어요";
    return "단어 하나만 던져도 괜찮아요";
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
    const { color, rotation } = getCardMeta(post.id);

    const cardStyle = isFeatured
      ? {
          background: 'linear-gradient(135deg, #FBF8F3 0%, #F5F1E8 100%)',
          border: '3px solid #D4A574',
          boxShadow: '6px 6px 20px rgba(212,165,116,0.35)',
          transform: 'rotate(0deg)',
        }
      : {
          background: color.bg,
          border: `2px solid ${color.border}`,
          boxShadow: `3px 3px 10px rgba(0,0,0,0.10), 0 1px 3px rgba(0,0,0,0.06)`,
          transform: `rotate(${rotation}deg)`,
          transition: 'transform 0.2s ease, box-shadow 0.2s ease',
        };

    return (
      <div
        onClick={onClick}
        className="rounded-sm p-5 cursor-pointer relative group"
        style={cardStyle}
        onMouseEnter={(e) => {
          if (!isFeatured) {
            e.currentTarget.style.transform = `rotate(0deg) scale(1.03)`;
            e.currentTarget.style.boxShadow = `6px 6px 18px rgba(0,0,0,0.15)`;
            e.currentTarget.style.zIndex = '10';
          }
        }}
        onMouseLeave={(e) => {
          if (!isFeatured) {
            e.currentTarget.style.transform = `rotate(${rotation}deg) scale(1)`;
            e.currentTarget.style.boxShadow = `3px 3px 10px rgba(0,0,0,0.10), 0 1px 3px rgba(0,0,0,0.06)`;
            e.currentTarget.style.zIndex = '1';
          }
        }}
      >
        {/* 테이프 */}
        <div
          className="absolute -top-3 left-1/2 transform -translate-x-1/2 w-14 h-5 rounded-sm opacity-70"
          style={{
            background: isFeatured ? '#E8D5B0' : color.tape,
            boxShadow: '0 1px 3px rgba(0,0,0,0.12)',
          }}
        />

        <div className="relative z-10 mt-1">
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold text-gray-700">{post.author}</span>
              <span className="text-xs text-gray-400">•</span>
              <span className="text-xs text-gray-400">{post.timeAgo}</span>
            </div>
            <div className="flex items-center gap-2">
              {post.topic && (
                <div className="flex items-center gap-1 text-xs text-amber-700 bg-white/60 px-2 py-0.5 rounded-full border border-amber-200">
                  <span>💭 {post.topic}</span>
                </div>
              )}
            </div>
          </div>

          <p className="text-gray-800 mb-4 line-clamp-3 leading-loose" style={{fontFamily: "'Jua', sans-serif", fontSize: '1.35rem'}}>{post.content}</p>

          <div className="flex items-center gap-4 text-sm text-gray-600">
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleEchoClick(post);
              }}
              className="flex items-center gap-1.5 hover:text-amber-600 transition-colors group/echo"
            >
              <div className="relative">
                <EchoIcon count={post.echoes} />
                <div className="absolute inset-0 scale-0 group-hover/echo:scale-150 opacity-0 group-hover/echo:opacity-30 transition-all duration-500">
                  <EchoIcon count={post.echoes} />
                </div>
              </div>
              <span className="font-bold">{post.echoes > 0 ? `${post.echoes}명이 받았어요` : '메아리 보내기'}</span>
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
            
            <div className="rounded-xl p-4 mb-6" style={{
              background: '#FFFEF5',
              border: '1.5px solid #E8E0C8',
              boxShadow: '0 2px 8px rgba(0,0,0,0.06)'
            }}>
              <p className="text-gray-900 whitespace-pre-wrap leading-loose" style={{fontFamily: "'Jua', sans-serif", fontSize: '1.45rem'}}>{post.content}</p>
            </div>
            
            <div className="mb-6 pb-6 border-b">
              <button 
                onClick={() => handleEchoClick(post)}
                className="flex items-center gap-1.5 hover:text-purple-600 transition-colors mb-3"
              >
                <EchoIcon count={post.echoes} />
                <span className="font-bold text-sm text-gray-700">{post.echoes > 0 ? `${post.echoes}명이 받았어요` : '메아리 보내기'}</span>
              </button>
              
              {/* 메아리 상세 표시 */}
              {post.echoMessages && Object.keys(post.echoMessages).length > 0 && (
                <div className="space-y-2 mt-3">
                  {(() => {
                    const total = Object.values(post.echoMessages).reduce((sum, c) => sum + c, 0);
                    return Object.entries(post.echoMessages)
                      .sort((a, b) => b[1] - a[1])
                      .map(([msg, count]) => {
                        const option = echoMessageOptions.find(o => o.label === msg);
                        const percent = total > 0 ? Math.round((count / total) * 100) : 0;
                        return (
                          <div key={msg}>
                            <div className="flex items-center justify-between mb-1">
                              <div className="flex items-center gap-1.5">
                                <span className="text-base">{option?.emoji || '🤍'}</span>
                                <span className="text-sm font-bold" style={{color: '#4A3F35'}}>{msg}</span>
                              </div>
                              <span className="text-xs font-bold" style={{color: '#8B7355'}}>{count}명 · {percent}%</span>
                            </div>
                            <div className="w-full rounded-full h-2" style={{background: '#E8E0D5'}}>
                              <div
                                className="h-2 rounded-full transition-all duration-500"
                                style={{
                                  width: `${percent}%`,
                                  background: 'linear-gradient(to right, #E0C9A8, #D4A574)'
                                }}
                              />
                            </div>
                          </div>
                        );
                      });
                  })()}
                </div>
              )}
            </div>
            
            <div className="mb-4">
              <h3 className="text-sm font-bold text-gray-800 mb-3 flex items-center gap-2">
                <MessageCircle size={16} style={{color: '#D4A574'}} />
                울림 {post.comments?.length || 0}개
              </h3>
            </div>
            
            <div className="space-y-3 mb-6">
              {(post.comments || []).map((comment, idx) => (
                <div key={idx} className="rounded-xl p-4 border" style={{background: '#FBF8F3', borderColor: '#E8E0D5'}}>
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
                placeholder="울림을 남겨주세요"
                className="w-full p-4 border-2 rounded-xl focus:outline-none focus:ring-2 resize-none"
                style={{
                  backgroundColor: '#FBF8F3',
                  borderColor: '#E8E0D5',
                  color: '#4A3F35'
                }}
                onFocus={(e) => {
                  e.currentTarget.style.borderColor = '#D4A574';
                  e.currentTarget.style.boxShadow = '0 0 0 3px rgba(212,165,116,0.1)';
                }}
                onBlur={(e) => {
                  e.currentTarget.style.borderColor = '#E8E0D5';
                  e.currentTarget.style.boxShadow = 'none';
                }}
                rows="3"
              />
              <button
                onClick={handleSubmitComment}
                className="w-full text-white py-3 rounded-xl transition-all font-bold shadow-md hover:shadow-lg"
                style={{
                  background: 'linear-gradient(to right, #E0C9A8, #D4A574)',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'linear-gradient(to right, #D4A574, #C9A875)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'linear-gradient(to right, #E0C9A8, #D4A574)';
                }}
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
    <div className="min-h-screen relative flex flex-col" style={{
      background: 'radial-gradient(ellipse 800px 600px at 50% 0%, #F5F1E8 0%, #E8E0D5 40%, #D9CFC0 100%)'
    }}>
      {/* 공감 메시지 선택 모달 */}
      {showEchoModal && (
        <div 
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
          onClick={() => setShowEchoModal(false)}
        >
          <div 
            className="rounded-2xl p-6 max-w-md w-full shadow-2xl"
            onClick={(e) => e.stopPropagation()}
            style={{
              background: '#FBF8F3',
              boxShadow: '0 20px 40px rgba(0,0,0,0.2)'
            }}
          >
            <h3 className="text-xl font-black mb-2 text-center" style={{color: '#4A3F35'}}>
              메아리를 보내요
            </h3>
            <p className="text-xs text-center mb-5 font-medium" style={{color: '#8B7355'}}>
              이 글을 읽고 어떤 마음이 들었나요?
            </p>
            <div className="space-y-2">
              {echoMessageOptions.map((option) => (
                <button
                  key={option.label}
                  onClick={() => handleEchoWithMessage(option.label)}
                  className="w-full py-3 px-4 rounded-xl transition-all font-bold flex items-center gap-3"
                  style={{
                    background: '#F5F1E8',
                    color: '#4A3F35',
                    border: '2px solid #E8E0D5',
                    boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = '#E8E0D5';
                    e.currentTarget.style.transform = 'scale(1.02)';
                    e.currentTarget.style.boxShadow = '0 4px 8px rgba(212,165,116,0.3)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = '#F5F1E8';
                    e.currentTarget.style.transform = 'scale(1)';
                    e.currentTarget.style.boxShadow = '0 2px 4px rgba(0,0,0,0.05)';
                  }}
                >
                  <span className="text-2xl">{option.emoji}</span>
                  <div className="text-left">
                    <div className="font-black text-sm" style={{color: '#4A3F35'}}>{option.label}</div>
                    <div className="text-xs font-medium" style={{color: '#8B7355'}}>{option.desc}</div>
                  </div>
                </button>
              ))}
            </div>
            <button
              onClick={() => setShowEchoModal(false)}
              className="w-full mt-4 text-sm font-medium"
              style={{color: '#8B7355'}}
            >
              취소
            </button>
          </div>
        </div>
      )}
      <div className="fixed inset-0 pointer-events-none opacity-10">
        <svg className="absolute top-20 left-10 w-64 h-64 animate-pulse-slow">
          <circle cx="128" cy="128" r="100" fill="none" stroke="#D4A574" strokeWidth="1"/>
          <circle cx="128" cy="128" r="70" fill="none" stroke="#D4A574" strokeWidth="1"/>
          <circle cx="128" cy="128" r="40" fill="none" stroke="#D4A574" strokeWidth="1"/>
        </svg>
        <svg className="absolute bottom-20 right-10 w-96 h-96 animate-pulse-slow" style={{animationDelay: '1s'}}>
          <circle cx="192" cy="192" r="150" fill="none" stroke="#C9A875" strokeWidth="1"/>
          <circle cx="192" cy="192" r="110" fill="none" stroke="#C9A875" strokeWidth="1"/>
          <circle cx="192" cy="192" r="70" fill="none" stroke="#C9A875" strokeWidth="1"/>
        </svg>
      </div>

      {showRipple && (
        <div className="fixed inset-0 pointer-events-none z-50 flex items-center justify-center">
          <div className="relative w-96 h-96">
            <div className="absolute inset-0 rounded-full opacity-30 animate-ripple-out" style={{backgroundColor: '#D4A574'}}/>
            <div className="absolute inset-0 rounded-full opacity-20 animate-ripple-out" style={{backgroundColor: '#C9A875', animationDelay: '0.3s'}}/>
            <div className="absolute inset-0 rounded-full opacity-10 animate-ripple-out" style={{backgroundColor: '#BEA070', animationDelay: '0.6s'}}/>
          </div>
        </div>
      )}

      <header className={`bg-white/80 backdrop-blur-sm shadow-sm fixed top-0 left-0 right-0 z-40 border-b-2 transition-all ${selectedPost ? 'hidden' : ''}`} style={{borderColor: '#E8E0D5'}}>
        <div className="max-w-6xl mx-auto px-4 py-2.5 md:py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 md:gap-3">
              <div className="relative hidden md:block">
                <StickyNote className="w-7 h-7 md:w-10 md:h-10" style={{color: '#D4A574'}} />
                <div className="absolute inset-0 animate-ping opacity-20">
                  <StickyNote className="w-7 h-7 md:w-10 md:h-10" style={{color: '#D4A574'}} />
                </div>
              </div>
              <div className="cursor-pointer" onClick={() => setView('feed')}>
                <h1 className="font-black" style={{
                  background: 'linear-gradient(to right, #D4A574, #C9A875)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text',
                  fontFamily: "'Pretendard', sans-serif",
                  fontSize: window.innerWidth < 768 ? '1.1rem' : '1.7rem',
                  lineHeight: '1.2',
                  fontWeight: '800'
                }}>
                  마인드포스팃
                </h1>
                <p className="hidden md:block text-xs font-medium" style={{color: '#8B7355'}}>오늘 다 내려놓고, 내일은 가볍게요</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {/* 접속자 수: 모바일은 축약, PC는 풀텍스트 */}
              <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-full text-xs font-bold"
                style={{background: 'rgba(212,165,116,0.15)', color: '#8B7355', border: '1px solid rgba(212,165,116,0.3)'}}>
                <span className="inline-block w-1.5 h-1.5 rounded-full animate-pulse" style={{background: '#D4A574'}}/>
                <span className="md:hidden">🌙 {onlineCount}명</span>
                <span className="hidden md:inline">지금 {onlineCount}명이 깨어있어요</span>
              </div>
              <button
                onClick={() => setView(view === 'feed' ? 'write' : 'feed')}
                className="text-white px-4 md:px-6 py-2 md:py-2.5 rounded-full transition-all font-bold shadow-md hover:shadow-lg text-sm md:text-base"
                style={{background: 'linear-gradient(to right, #E0C9A8, #DBC5A5)'}}
              >
                {view === 'feed' ? '📝 남기기' : '📋 메아리'}
              </button>
              <button
                onClick={() => setShowAdmin(true)}
                className="p-2 transition-all"
                style={{color: '#8B7355'}}
                title="관리자"
              >
                <Shield size={20} />
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-6xl mx-auto px-4 pt-24 md:pt-28 pb-6 md:pb-8 relative z-10 w-full">
        {view === 'feed' ? (
          <>
            <div className="mb-6 flex justify-center">
              <div className="inline-flex bg-white/80 backdrop-blur-sm rounded-full p-1 shadow-md border-2" style={{borderColor: '#E8E0D5'}}>
                {['최신순', '메아리순'].map((sortOption) => (
                  <button
                    key={sortOption}
                    onClick={() => setSortBy(sortOption)}
                    className={`px-4 md:px-6 py-2 rounded-full text-xs md:text-sm font-bold transition-all ${
                      sortBy === sortOption
                        ? 'text-white shadow-md'
                        : ''
                    }`}
                    style={sortBy === sortOption ? {
                      background: 'linear-gradient(to right, #E0C9A8, #DBC5A5)'
                    } : {
                      color: '#6B5D4F'
                    }}
                  >
                    {sortOption}
                  </button>
                ))}
              </div>
            </div>

            <div className="mb-8">
              {/* 피드 헤더는 글이 있을 때만 표시 */}
              {!loading && posts.length > 0 && (
                <div className="text-center mb-6 md:mb-8">
                  <h2 className="text-xl md:text-2xl font-black mb-2" style={{color: '#4A3F35'}}>지금 떠오른 생각들</h2>
                  <p className="text-sm md:text-base font-medium" style={{color: '#6B5D4F'}}>정리되지 않아도 되는 생각들 🌙</p>
                  <p className="text-xs font-bold mt-2" style={{color: '#D4A574'}}>⏰ 하루가 지나면 사라져요</p>
                </div>
              )}
              
              {loading ? (
                <div className="text-center py-12">
                  <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-t-transparent" style={{borderColor: '#D4A574'}}></div>
                  <p className="mt-4" style={{color: '#6B5D4F'}}>마음들을 불러오고 있어요...</p>
                </div>
              ) : posts.length === 0 ? (
                <div className="max-w-md mx-auto text-center py-16 px-6">
                  {/* 상단 문구 */}
                  <div className="mb-8 space-y-3">
                    <h3 className="text-2xl md:text-3xl font-black leading-tight" style={{color: '#4A3F35'}}>
                      지금 떠오른 생각들
                    </h3>
                    <p className="text-base md:text-lg font-medium" style={{color: '#6B5D4F'}}>
                      정리되지 않아도 되는 생각들 🌙
                    </p>
                    <p className="text-sm font-medium" style={{color: '#8B7355'}}>
                      하루가 지나면 사라져요
                    </p>
                  </div>
                  
                  {/* 중간 문구 */}
                  <div className="mb-6">
                    <p className="text-lg font-bold" style={{color: '#6B5D4F'}}>
                      지금은 조용한 시간
                    </p>
                  </div>
                  
                  {/* 버튼 */}
                  <button
                    onClick={() => setView('write')}
                    className="text-white px-8 py-4 rounded-full transition-all font-black text-lg shadow-lg hover:shadow-xl mb-8"
                    style={{
                      background: 'linear-gradient(to right, #E0C9A8, #D4A574)'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = 'linear-gradient(to right, #D4A574, #C9A875)';
                      e.currentTarget.style.transform = 'scale(1.05)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = 'linear-gradient(to right, #E0C9A8, #D4A574)';
                      e.currentTarget.style.transform = 'scale(1)';
                    }}
                  >
                    여기 남기기
                  </button>
                  
                  {/* 하단 정체성 문구 */}
                  <div className="space-y-2 pt-6 border-t-2" style={{borderColor: '#E8E0D5'}}>
                    <p className="text-sm font-bold" style={{color: '#4A3F35'}}>
                      하루 뒤 사라지는 익명 공간이에요
                    </p>
                    <p className="text-xs font-medium" style={{color: '#6B5D4F'}}>
                      로그인 없이, 이름 없이
                    </p>
                    <p className="text-xs font-bold" style={{color: '#D4A574'}}>
                      매일 자정에 비워져요
                    </p>
                  </div>
                </div>
              ) : (
                <>
                  {/* 오늘의 포스트잇 */}
                  {featuredPostId && sortedPosts.find(p => p.id === featuredPostId) && (
                    <div className="mb-10">
                      {/* 배경 강조 영역 */}
                      <div className="relative rounded-2xl p-6 md:p-8"
                        style={{
                          background: 'linear-gradient(135deg, rgba(212,165,116,0.15) 0%, rgba(201,168,117,0.08) 100%)',
                          border: '1.5px solid rgba(212,165,116,0.35)',
                        }}>
                        {/* 타이틀 */}
                        <div className="flex items-center justify-center gap-2 mb-5">
                          <div className="h-px flex-1" style={{background: 'linear-gradient(to right, transparent, rgba(212,165,116,0.5))'}}/>
                          <div className="flex items-center gap-2 px-4 py-1.5 rounded-full"
                            style={{background: 'rgba(212,165,116,0.2)', border: '1px solid rgba(212,165,116,0.4)'}}>
                            <span className="text-base">📌</span>
                            <span className="text-sm font-black" style={{color: '#B8874E'}}>오늘의 포스팃</span>
                          </div>
                          <div className="h-px flex-1" style={{background: 'linear-gradient(to left, transparent, rgba(212,165,116,0.5))'}}/>
                        </div>
                        {/* 카드 */}
                        <div className="max-w-xl mx-auto">
                          <PostCard
                            post={sortedPosts.find(p => p.id === featuredPostId)}
                            index={-1}
                            onClick={() => setSelectedPost(sortedPosts.find(p => p.id === featuredPostId))}
                            isFeatured={true}
                          />
                        </div>
                        {/* 하단 문구 */}
                        {(() => {
                          const fp = sortedPosts.find(p => p.id === featuredPostId);
                          const echoCount = fp?.echoes || 0;
                          return (
                            <p className="text-center text-xs mt-4 font-medium" style={{color: '#A89070'}}>
                              {echoCount > 0
                                ? `${echoCount}명이 메아리를 보냈어요`
                                : '오늘의 포스팃이에요'}
                            </p>
                          );
                        })()}
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
            <div className="border-2 rounded-2xl p-6 md:p-8 shadow-xl relative"
                 style={{
                   background: '#FBF8F3',
                   borderColor: '#E8E0D5',
                   boxShadow: '8px 8px 16px rgba(0,0,0,0.1)'
                 }}>
              <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 w-20 h-8 bg-white/50 rounded-sm" 
                   style={{boxShadow: '0 2px 4px rgba(0,0,0,0.1)'}}/>
              
              <div className="text-center mb-6">
                <h2 className="text-xl md:text-2xl font-black mb-2" style={{color: '#4A3F35'}}>잠 못 드는 밤 🌙</h2>
                <p className="text-sm md:text-base font-medium" style={{color: '#6B5D4F'}}>정리되지 않아도 괜찮아요. 하루가 지나면 사라져요.</p>
              </div>
              
              {/* 주제 선택 */}
              {topics.length > 0 && (
                <div className="mb-5">
                  <label className="block text-sm font-bold mb-3" style={{color: '#4A3F35'}}>
                    💭 오늘의 주제를 선택해보세요 (선택사항)
                  </label>
                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={() => setSelectedTopic(null)}
                      className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                        selectedTopic === null
                          ? 'text-white shadow-md'
                          : 'bg-white/60 hover:bg-white border-2'
                      }`}
                      style={selectedTopic === null ? {
                        background: 'linear-gradient(to right, #E0C9A8, #DBC5A5)'
                      } : {
                        color: '#6B5D4F',
                        borderColor: '#D9CFC0'
                      }}
                    >
                      자유 주제
                    </button>
                    {topics.map((topic) => (
                      <button
                        key={topic.id}
                        onClick={() => setSelectedTopic(topic.text)}
                        className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                          selectedTopic === topic.text
                            ? 'text-white shadow-md'
                            : 'bg-white/60 hover:bg-white border-2'
                        }`}
                        style={selectedTopic === topic.text ? {
                          background: 'linear-gradient(to right, #E0C9A8, #DBC5A5)'
                        } : {
                          color: '#6B5D4F',
                          borderColor: '#D9CFC0'
                        }}
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
                placeholder={getPlaceholder()}
                className="w-full p-4 md:p-5 border-2 rounded-xl focus:outline-none focus:ring-2 focus:border-transparent mb-5 resize-none font-medium"
                style={{
                  backgroundColor: '#FBF8F3',
                  borderColor: '#E8E0D5',
                  color: '#4A3F35'
                }}
                rows="8"
              />
              
              
              <button
                onClick={handleSubmit}
                disabled={!content.trim()}
                className="w-full text-white py-3 md:py-4 rounded-xl disabled:cursor-not-allowed transition-all font-black text-base md:text-lg shadow-lg hover:shadow-xl"
                style={!content.trim() ? {
                  background: '#C9C4BD',
                  cursor: 'not-allowed'
                } : {
                  background: 'linear-gradient(to right, #E0C9A8, #DBC5A5)'
                }}
              >
                남기기
              </button>
              <div className="text-center mt-3 space-y-1">
                <p className="text-xs md:text-sm font-medium" style={{color: '#6B5D4F'}}>이름 없이 남고</p>
                <p className="text-xs font-bold" style={{color: '#D4A574'}}>⏰ 하루가 지나면 사라져요</p>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="bg-white/50 backdrop-blur-sm py-6 border-t" style={{borderColor: '#E8E0D5'}}>
        <div className="max-w-6xl mx-auto px-4 text-center">
          <button
            onClick={() => setShowTerms(true)}
            className="text-sm transition-colors underline hover:no-underline font-medium"
            style={{color: '#8B7355'}}
          >
            이용약관
          </button>
          <p className="text-xs mt-3 font-medium" style={{color: '#A89885'}}>© 2026 마인드포스팃. 새벽의 익명 공간</p>
        </div>
      </footer>

      {/* Terms Modal */}
      {showTerms && <Terms onClose={() => setShowTerms(false)} />}

      <style>{`
        /* 종이 질감 효과 */
        body::before {
          content: '';
          position: fixed;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          opacity: 0.03;
          z-index: 1;
          pointer-events: none;
          background-image: 
            repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,0.03) 2px, rgba(0,0,0,0.03) 4px),
            repeating-linear-gradient(90deg, transparent, transparent 2px, rgba(0,0,0,0.03) 2px, rgba(0,0,0,0.03) 4px);
        }
        
        @keyframes ripple-out {
          0% { transform: scale(0); opacity: 0.6; }
          100% { transform: scale(4); opacity: 0; }
        }
        
        @keyframes pulse-slow {
          0%, 100% { opacity: 0.15; transform: scale(1); }
          50% { opacity: 0.25; transform: scale(1.05); }
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