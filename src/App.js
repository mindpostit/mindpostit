import React, { useState, useEffect, useRef } from 'react';
import {
  signInWithGoogle, logOut,
  onAuthChange, createThread, addMessage, subscribeMessages,
  subscribeUserThreads, subscribeAllThreads, setThreadAlert,
  deleteThread
} from './firebase';
import { validateContent } from './contentFilter';

// ── 관리자 이메일 (준의 실제 이메일로 변경) ──
const ADMIN_EMAIL = 'peerlabs@naver.com';

// ── 색상 시스템 ──────────────────────────────
const C = {
  bg: '#f3ede4',
  bg2: '#ebe3d8',
  paper: '#fffdfa',
  panel: '#faf5ee',
  line: '#d9d0c3',
  ink: '#262522',
  muted: '#7d766d',
  soft: '#9f968b',
  accent: '#23231f',
};

// ── 유틸 ─────────────────────────────────────
const fmt = (ts) => {
  if (!ts) return '방금';
  const d = ts.toDate ? ts.toDate() : new Date(ts);
  const now = new Date();
  const diff = Math.floor((now - d) / 86400000);
  const t = d.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' });
  if (diff === 0) return `오늘 ${t}`;
  if (diff === 1) return `어제 ${t}`;
  return `${diff}일 전`;
};

const isAdmin = (u) => u && u.email === ADMIN_EMAIL;

// ── 공통 스타일 ──────────────────────────────
const btnFill = { width: '100%', padding: '11px', border: 'none', borderRadius: '10px', background: C.accent, color: '#f8f5ef', fontSize: '13px', fontWeight: '800', letterSpacing: '.04em', cursor: 'pointer', fontFamily: "'Noto Sans KR', sans-serif" };
const btnOutline = { width: '100%', padding: '10px', border: `1px solid ${C.line}`, borderRadius: '10px', background: 'transparent', color: '#5d5851', fontSize: '13px', fontWeight: '600', cursor: 'pointer', fontFamily: "'Noto Sans KR', sans-serif" };
const btnSoft = { width: '100%', padding: '10px', border: `1px dashed #d5cabe`, borderRadius: '10px', background: 'transparent', color: '#988f83', fontSize: '12px', cursor: 'pointer', fontFamily: "'Noto Sans KR', sans-serif" };
const inputStyle = { width: '100%', height: '34px', padding: '0 12px', border: `1px solid ${C.line}`, borderRadius: '9px', background: C.paper, fontSize: '13px', fontWeight: '300', color: C.ink, outline: 'none', fontFamily: "'Noto Sans KR', sans-serif", marginBottom: '0' };
const pageStyle = { minHeight: '100vh', background: `linear-gradient(180deg,#f6f1ea 0%,#ede5da 100%)`, fontFamily: "'Noto Sans KR', sans-serif" };
const centerStyle = { display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', padding: '24px' };

// ── 앱 ───────────────────────────────────────
export default function App() {
  const [user, setUser] = useState(null);
  const [authReady, setAuthReady] = useState(false);
  const [view, setView] = useState('appsplash');
  const [currentThread, setCurrentThread] = useState(null);
  const [prevView, setPrevView] = useState('splash');

  useEffect(() => {
    const unsub = onAuthChange((u) => { setUser(u); setAuthReady(true); });
    return unsub;
  }, []);

  useEffect(() => {
  }, [authReady, user]);

  const goThread = (t) => { setCurrentThread(t); setView('thread'); };

  if (user && isAdmin(user)) return <AdminView user={user} setUser={setUser} setView={setView} />;

  return (
    <div style={pageStyle}>
      {view === 'appsplash' && <AppSplash setView={setView} />}
      {view === 'splash' && <Splash setView={setView} user={user} authReady={authReady} />}
      {view === 'guestgate' && <GuestGate setView={setView} setPrevView={setPrevView} setUser={setUser} />}
      {view === 'write' && <Write user={user} setView={setView} />}
      {view === 'done' && <Done setView={setView} setPrevView={setPrevView} user={user} />}
      {view === 'login' && <Login setView={setView} setUser={setUser} prevView={prevView} />}
      {view === 'home' && <Home user={user} setView={setView} setUser={setUser} goThread={goThread} />}
      {view === 'thread' && <Thread thread={currentThread} setView={setView} />}
    </div>
  );
}

// ── 앱 스플래시 (로딩) ────────────────────────
function AppSplash({ setView }) {
  const sentences = [
    '괜찮은 척 넘긴 마음이 있나요.',
    '잘 정리되지 않아도 괜찮아요.',
    '지금 마음 그대로,\n익명으로 남겨보세요.',
  ];
  // 각 문장: 페이드인(800ms) → 머무름(2000ms) → 페이드아웃(800ms)
  const FADE = 800;
  const HOLD = 2000;
  const STEP = FADE + HOLD + FADE;

  const [phase, setPhase] = useState(0);
  // phase: 0~2 = 문장, 3 = 로고, 4 = 전환
  const [visible, setVisible] = useState(false);
  const [showSkip, setShowSkip] = useState(false);

  useEffect(() => {
    const timers = [];
    // 건너뛰기 2초 후 노출
    timers.push(setTimeout(() => setShowSkip(true), 2000));

    const runPhase = (p) => {
      setPhase(p);
      setVisible(false);
      timers.push(setTimeout(() => setVisible(true), 50));
      if (p < sentences.length) {
        // 다음 문장으로
        timers.push(setTimeout(() => setVisible(false), FADE + HOLD));
        timers.push(setTimeout(() => runPhase(p + 1), STEP));
      } else if (p === sentences.length) {
        // 로고 단계
        timers.push(setTimeout(() => setVisible(false), FADE + 1400));
        timers.push(setTimeout(() => setView('splash'), FADE + 1400 + FADE));
      }
    };
    runPhase(0);
    return () => timers.forEach(clearTimeout);
  }, []);

  const isLogo = phase === sentences.length;
  const text = !isLogo ? sentences[phase] : null;

  return (
    <div style={{ ...pageStyle, background: C.bg, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '0 40px' }}>
      <style>{'@keyframes fadeSlideIn{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}}'}</style>

      {/* 문장 or 로고 */}
      <div style={{ opacity: visible ? 1 : 0, transition: `opacity ${FADE}ms ease`, textAlign: 'center', whiteSpace: 'pre-line' }}>
        {!isLogo ? (
          <p style={{ fontSize: '26px', fontWeight: '900', color: C.ink, lineHeight: '1.75', letterSpacing: '-.02em', margin: 0 }}>{text}</p>
        ) : (
          <div style={{ fontSize: '34px', color: '#a29789', fontFamily: "'Black Han Sans', sans-serif", letterSpacing: '.04em' }}>마인드포스팃</div>
        )}
      </div>

      {/* 건너뛰기 */}
      <button
        onClick={() => setView('splash')}
        style={{ position: 'absolute', bottom: '240px', fontSize: '11px', color: showSkip ? '#c4bdb4' : 'transparent', background: 'none', border: 'none', cursor: 'pointer', transition: 'color 1s ease' }}
      >건너뛰기</button>
    </div>
  );
}

// ── 스플래시 ─────────────────────────────────
function Splash({ setView, user }) {
  const [showModal, setShowModal] = useState(false);

  return (
    <div style={{ ...pageStyle, ...centerStyle }}>
      <style>{`@keyframes wobble{0%{transform:rotate(-2deg)}20%{transform:rotate(-4deg)}40%{transform:rotate(0deg)}60%{transform:rotate(-3deg)}80%{transform:rotate(-1deg)}100%{transform:rotate(-2deg)}}.postit-wobble{animation:wobble 0.7s ease-in-out infinite}`}</style>
      {showModal && (
        <div
          onClick={() => setShowModal(false)}
          style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(39,37,35,.5)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}
        >
          <div onClick={e => e.stopPropagation()} style={{ background: C.paper, border: `1px solid ${C.line}`, borderRadius: '18px', padding: '22px 20px', width: '100%', maxWidth: '320px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
              <span style={{ fontSize: '15px', fontWeight: '800', color: C.ink }}>이용 방법</span>
              <button onClick={() => setShowModal(false)} style={{ background: 'none', border: 'none', fontSize: '16px', color: C.soft, cursor: 'pointer', padding: '0' }}>✕</button>
            </div>
            <p style={{ fontSize: '12px', color: '#6c655d', lineHeight: '1.8', marginBottom: '16px' }}>판단 없이 들어주는 1:1 경청 공간이에요. 이름은 공개되지 않고, 진짜 사람이 직접 읽고 답장을 남겨요.</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '18px' }}>
              {[
                { n: '1', title: '회원가입 후 익명으로 남기기', desc: '이름은 절대 공개되지 않아요.' },
                { n: '2', title: '진짜 사람이 읽고 답장', desc: 'AI 자동응답이 아니에요. 직접 읽고 담백하게 답장해요.' },
                { n: '3', title: '내 공간에서 확인', desc: '내 이야기와 답장이 내 공간에만 쌓여요.' },
              ].map(({ n, title, desc }) => (
                <div key={n} style={{ display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
                  <span style={{ width: '20px', height: '20px', borderRadius: '50%', background: '#f3ede4', border: `0.5px solid ${C.line}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px', color: '#7a7168', flexShrink: 0 }}>{n}</span>
                  <div>
                    <p style={{ fontSize: '12px', fontWeight: '700', color: C.ink, margin: '0 0 2px' }}>{title}</p>
                    <p style={{ fontSize: '11px', color: C.muted, margin: 0, lineHeight: '1.6' }}>{desc}</p>
                  </div>
                </div>
              ))}
            </div>
            <button style={btnFill} onClick={() => { setShowModal(false); user && !user.isAnonymous ? setView('write') : setView('guestgate'); }}>지금 남기기</button>
          </div>
        </div>
      )}

      <div style={{ textAlign: 'center', marginBottom: '32px' }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '22px' }}>
          <div style={{ fontSize: '34px', color: '#a29789', fontFamily: "'Black Han Sans', sans-serif", letterSpacing: '.04em', marginBottom: '14px' }}>마인드포스팃</div>
          {/* 포스트잇 */}
          <div className="postit-wobble" style={{ position: 'relative', width: '70%', minHeight: '100px', background: '#f7f4ef', border: '1px solid #e2dbd0', borderRadius: '8px', padding: '16px 12px 14px', boxShadow: '0 3px 8px rgba(38,37,34,.07)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{ position: 'absolute', top: '-5px', left: '50%', transform: 'translateX(-50%)', width: '34px', height: '10px', borderRadius: '2px', background: 'rgba(198,188,170,.52)' }} />
            <p style={{ fontFamily: "'Nanum Brush Script', cursive", fontSize: '26px', color: '#7a7168', margin: 0, textAlign: 'center' }}>괜찮나요?</p>
          </div>
        </div>
        <h1 style={{ fontSize: '36px', fontWeight: '900', letterSpacing: '-.04em', lineHeight: '1.5', color: C.ink, marginBottom: '0' }}>
          어떤 이야기든,<br />여기선 괜찮아요.
        </h1>
        <div style={{ width: '1px', height: '22px', background: '#c0b6a8', margin: '14px auto' }} />
        <p style={{ fontSize: '14px', fontWeight: '300', lineHeight: '1.8', color: '#7a7168' }}>충분히 들어줄게요.</p>
      </div>

      <style>{`@keyframes breathe { 0%,100%{transform:scale(1);box-shadow:0 4px 16px rgba(39,37,35,.20)} 50%{transform:scale(1.025);box-shadow:0 8px 28px rgba(39,37,35,.32)} }`}</style>
      <div style={{ width: '100%', maxWidth: '290px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
        <button style={{ ...btnFill, animation: 'breathe 2.5s ease-in-out infinite' }} onClick={() => user && !user.isAnonymous ? setView('write') : setView('guestgate')}>지금 남기기</button>
        {user && !user.isAnonymous ? (
          <button style={btnOutline} onClick={() => setView('home')}>내 공간 보러 가기</button>
        ) : (
          <>
            <button style={btnOutline} onClick={() => setView('login')}>로그인 · 내 공간으로</button>
            <button style={btnSoft} onClick={() => setShowModal(true)}>이용 방법</button>
          </>
        )}
      </div>

      <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', justifyContent: 'center', marginTop: '16px' }}>
        {['익명 가능', '사람이 읽음', '진심 답장'].map(t => (
          <span key={t} style={{ padding: '4px 9px', borderRadius: '999px', border: `1px solid ${C.line}`, background: '#f7f0e7', fontSize: '11px', color: '#6d665d' }}>{t}</span>
        ))}
      </div>
      <p style={{ marginTop: '12px', fontSize: '11px', color: C.soft }}>익명으로 시작해도 괜찮아요.</p>
    </div>
  );
}

// ── 비로그인 가입 유도 ────────────────────────
function GuestGate({ setView, setPrevView, setUser }) {
  const [error, setError] = useState('');
  const go = (target) => { setPrevView('guestgate'); setView(target); };

  return (
    <div style={{ ...pageStyle, ...centerStyle }}>
      <button onClick={() => setView('splash')} style={{ position: 'absolute', top: '24px', left: '24px', background: 'none', border: 'none', fontSize: '12px', color: C.soft, cursor: 'pointer' }}>← 돌아가기</button>

      <div style={{ background: C.paper, border: `1px solid ${C.line}`, borderRadius: '14px', padding: '28px 20px 24px', width: '100%', maxWidth: '340px', textAlign: 'center' }}>
        {/* 익명 처리된 이름 바 */}
        <div style={{ width: '56px', height: '8px', borderRadius: '4px', background: '#d8d0c6', margin: '0 auto 20px' }} />

        <h2 style={{ fontSize: '22px', fontWeight: '900', letterSpacing: '-.02em', color: C.ink, marginBottom: '10px' }}>처음이군요.</h2>
        <p style={{ fontSize: '12px', lineHeight: '1.8', color: C.muted, marginBottom: '24px' }}>
          가입하면 익명으로 남기고<br />답장을 받을 수 있어요.
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <button style={{ ...btnFill, display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#fff', color: C.ink, border: `1px solid ${C.line}` }} onClick={async () => { const r = await signInWithGoogle(); if (r.success) { setUser(r.user); setView('write'); } else setError(r.message); }}>
            <svg width="18" height="18" viewBox="0 0 24 24" style={{marginRight:'8px'}}><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>구글로 계속하기
          </button>
          {error && <p style={{ fontSize: '11px', color: '#c0392b', textAlign: 'center', margin: 0 }}>{error}</p>}
        </div>

        <p style={{ fontSize: '11px', color: '#ada496', marginTop: '16px' }}>이름 없이 남겨도, 진심으로 읽어요.</p>
      </div>
    </div>
  );
}

// ── 글쓰기 ───────────────────────────────────
function Write({ user, setView }) {
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const placeholder = (() => {
    const h = new Date().getHours();
    if (h >= 0 && h < 3) return '새벽엔 별 생각이 다 들죠.';
    if (h >= 3 && h < 6) return '아직 안 자고 있어요?';
    if (h >= 22) return '오늘 하루 어땠어요.';
    return '단어 하나만 던져도 괜찮아요.';
  })();

  const handleSubmit = async () => {
    if (!content.trim()) return;
    const v = validateContent(content);
    if (!v.valid) { setError(v.message); return; }
    const last = localStorage.getItem('lastPostTime');
    if (last && Date.now() - parseInt(last) < 60000) { setError('잠깐요! 1분에 한 번만 남길 수 있어요.'); return; }
    if (!user) { setError('잠깐만요, 다시 시도해줘요.'); return; }
    setLoading(true);
    const result = await createThread(user.uid, content, 'text');
    if (result.success) { localStorage.setItem('lastPostTime', Date.now().toString()); setView('done'); }
    else setError('잠깐 문제가 생겼어요. 다시 시도해줘요.');
    setLoading(false);
  };

  return (
    <div style={{ ...pageStyle, ...centerStyle }}>
      <span onClick={() => setView('splash')} style={{ position: 'absolute', top: '24px', left: '24px', fontSize: '11px', color: '#938a80', cursor: 'pointer' }}>← 돌아가기</span>

      <div style={{ background: C.paper, border: `1px solid ${C.line}`, borderRadius: '14px', padding: '13px 12px', width: '100%', maxWidth: '360px', position: 'relative', boxShadow: '0 4px 12px rgba(38,37,34,.04)' }}>
        <div style={{ position: 'absolute', top: '-6px', left: '50%', transform: 'translateX(-50%)', width: '38px', height: '11px', borderRadius: '2px', background: 'rgba(198,188,170,.52)' }} />

        <div style={{ fontSize: '14px', fontWeight: '800', textAlign: 'center', marginBottom: '5px' }}>말 못한 게 있죠.</div>
        <div style={{ fontSize: '10px', lineHeight: '1.7', textAlign: 'center', color: C.muted, marginBottom: '11px' }}>잘 정리되지 않아도 괜찮아요. 지금 마음 그대로 남겨도 돼요.</div>

        <textarea
          value={content}
          onChange={e => setContent(e.target.value.slice(0, 500))}
          placeholder={placeholder}
          rows={7}
          style={{ width: '100%', background: '#f8f2e8', border: `1px solid ${C.line}`, borderRadius: '9px', padding: '10px', fontSize: '12px', lineHeight: '1.75', color: '#4d4943', resize: 'none', outline: 'none', fontFamily: "'Noto Sans KR', sans-serif", marginBottom: '8px' }}
        />

        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', color: '#9b9287', marginBottom: '10px' }}>
          <span>익명으로 남겨져요</span>
          <span>{content.length} / 500</span>
        </div>

        {error && <p style={{ fontSize: '11px', color: '#d4433a', marginBottom: '8px', textAlign: 'center' }}>{error}</p>}

        <button
          style={{ ...btnFill, opacity: (!content.trim() || loading) ? 0.5 : 1 }}
          onClick={handleSubmit}
          disabled={!content.trim() || loading}
        >
          {loading ? '남기는 중...' : '남기기'}
        </button>

        <div style={{ marginTop: '9px', fontSize: '10px', lineHeight: '1.65', textAlign: 'center', color: '#9a9186' }}>
          익명이고, 나만의 공간에 쌓여요.
        </div>
      </div>
    </div>
  );
}

// ── 전송 완료 ────────────────────────────────
function Done({ setView, setPrevView, user }) {
  const [showNudge, setShowNudge] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setShowNudge(true), 3000);
    return () => clearTimeout(t);
  }, []);

  const handleAction = (fn) => { setShowNudge(false); fn(); };

  return (
    <div style={{ ...pageStyle, ...centerStyle }}>
      <style>{`
        @keyframes wobble {
          0%   { transform: rotate(-2deg); }
          20%  { transform: rotate(-4deg); }
          40%  { transform: rotate(0deg); }
          60%  { transform: rotate(-3deg); }
          80%  { transform: rotate(-1deg); }
          100% { transform: rotate(-2deg); }
        }
        .postit-wobble { animation: wobble 0.7s ease-in-out 0s infinite; }
      `}</style>

      <div
        className="postit-wobble"
        style={{ width: '130px', margin: '0 auto 16px', background: C.paper, border: `1px solid ${C.line}`, borderRadius: '10px', padding: '12px 10px', position: 'relative', boxShadow: '0 4px 10px rgba(38,37,34,.06)' }}
      >
        <div style={{ position: 'absolute', top: '-6px', left: '50%', transform: 'translateX(-50%)', width: '38px', height: '11px', borderRadius: '2px', background: 'rgba(198,188,170,.52)' }} />
        <p style={{ fontSize: '11px', lineHeight: '1.7', color: '#5a554e' }}>방금 남긴 이야기가 안전하게 전달됐어요.</p>
        <small style={{ display: 'block', marginTop: '6px', fontSize: '9px', color: '#b0a79c' }}>{new Date().toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })} · 오늘</small>
      </div>

      <h2 style={{ fontSize: '20px', fontWeight: '900', textAlign: 'center', letterSpacing: '-.02em', marginBottom: '6px' }}>남겨줘서 고마워요.</h2>
      <p style={{ fontSize: '12px', lineHeight: '1.75', textAlign: 'center', color: C.muted, marginBottom: '8px' }}>
        남겨준 이야기는<br />차분히 읽고 답장을 남겨둘게요.
      </p>

      <p style={{
        fontSize: '11px', color: '#9a9086', textAlign: 'center', marginBottom: '12px',
        opacity: showNudge ? 1 : 0,
        transform: showNudge ? 'translateX(0)' : 'translateX(-8px)',
        transition: 'opacity 0.6s ease, transform 0.6s ease'
      }}>
        답장을 놓치지 않으려면 →
      </p>

      <div style={{ width: '100%', maxWidth: '290px', display: 'flex', flexDirection: 'column', gap: '7px' }}>
        {user && !user.isAnonymous ? (
          <button style={btnFill} onClick={() => handleAction(() => setView('home'))}>내 공간 보러 가기</button>
        ) : (
          <>
            <button style={{ ...btnFill, display: 'flex', alignItems: 'center', justifyContent: 'center' }} onClick={() => handleAction(() => setView('login'))}>
              <svg width="16" height="16" viewBox="0 0 24 24" style={{marginRight:'8px'}}><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>
              구글로 로그인하고 답장 받기
            </button>
          </>
        )}
        <button style={btnSoft} onClick={() => handleAction(() => setView('splash'))}>처음으로</button>
      </div>

      <p style={{ marginTop: '12px', fontSize: '10px', lineHeight: '1.65', textAlign: 'center', color: '#9a9186' }}>AI가 아니라, 진짜 사람이 직접 읽고 남기는 답장이에요.</p>
    </div>
  );
}

// ── 로그인 ───────────────────────────────────
function Login({ setView, setUser, prevView = 'splash' }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const doGoogleLogin = async () => {
    setLoading(true); setError('');
    const r = await signInWithGoogle();
    if (r.success) { setUser(r.user); setView(prevView === 'guestgate' ? 'write' : 'home'); }
    else setError(r.message || '로그인에 실패했어요.');
    setLoading(false);
  };

  return (
    <div style={{ ...pageStyle, ...centerStyle }}>
      <button onClick={() => setView('splash')} style={{ position: 'absolute', top: '24px', left: '24px', background: 'none', border: 'none', fontSize: '12px', color: C.soft, cursor: 'pointer' }}>← 돌아가기</button>
      <div style={{ background: C.paper, border: `1px solid ${C.line}`, borderRadius: '14px', padding: '28px 20px 24px', width: '100%', maxWidth: '340px', textAlign: 'center' }}>
        <h2 style={{ fontSize: '22px', fontWeight: '900', letterSpacing: '-.02em', color: C.ink, marginBottom: '10px' }}>다시 왔군요.</h2>
        <p style={{ fontSize: '12px', lineHeight: '1.8', color: C.muted, marginBottom: '24px' }}>내 공간으로 돌아가요.</p>
        <button
          style={{ ...btnFill, display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#fff', color: C.ink, border: `1px solid ${C.line}`, opacity: loading ? 0.6 : 1 }}
          onClick={doGoogleLogin} disabled={loading}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" style={{marginRight:'8px'}}><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>
          {loading ? '로그인 중...' : '구글로 계속하기'}
        </button>
        {error && <p style={{ fontSize: '11px', color: '#c0392b', marginTop: '12px' }}>{error}</p>}
      </div>
    </div>
  );
}

// ── 홈 ───────────────────────────────────────
function Home({ user, setView, setUser, goThread }) {
  const [threads, setThreads] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    return subscribeUserThreads(user.uid, (t) => { setThreads(t); setLoading(false); });
  }, [user]);

  const doLogout = async () => { await logOut(); setUser(null); setView('splash'); };

  const hasReplied = threads.some(t => t.status === 'replied');
  const hasWaiting = threads.some(t => t.status === 'waiting');

  const banner = hasReplied
    ? { style: { background: '#272725' }, title: '답장이 도착했어요.', sub: '어젯밤 이야기를 읽고 답장을 남겼어요.', tc: '#f8f4ed', sc: '#c8bfb1' }
    : hasWaiting
    ? { style: { background: '#f4ede4', border: `1px dashed #d3c9bd` }, title: '받았어요.', sub: '차분히 읽고 답장을 남길게요.', tc: '#5a5349', sc: '#8a8278' }
    : { style: { background: 'linear-gradient(180deg,#fcf8f2 0%,#f4ebdf 100%)', border: `1px solid ${C.line}` }, title: '오늘 하루 어땠어요?', sub: '여기다 두고 가도 괜찮아요.', tc: '#403c37', sc: '#7d756b' };

  return (
    <div style={{ ...pageStyle, padding: '18px 18px 40px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', maxWidth: '380px', margin: '0 auto 14px' }}>
        <span style={{ fontSize: '16px', fontWeight: '400', letterSpacing: '.06em', color: '#847b71', fontFamily: "'Black Han Sans', sans-serif" }}>마인드포스팃</span>
        <button onClick={doLogout} style={{ fontSize: '10px', color: '#a39a8f', background: 'none', border: 'none', cursor: 'pointer' }}>로그아웃</button>
      </div>

      <div style={{ maxWidth: '380px', margin: '0 auto' }}>
        <div style={{ ...banner.style, borderRadius: '10px', padding: '10px 12px', marginBottom: '10px' }}>
          <p style={{ fontSize: '13px', fontWeight: '800', marginBottom: '3px', color: banner.tc }}>{banner.title}</p>
          <p style={{ fontSize: '11px', lineHeight: '1.65', color: banner.sc }}>{banner.sub}</p>
        </div>

        {loading ? (
          <p style={{ fontSize: '12px', color: C.soft, textAlign: 'center', padding: '24px 0' }}>불러오는 중...</p>
        ) : threads.length === 0 ? (
          <p style={{ fontSize: '13px', fontWeight: '300', color: C.soft, textAlign: 'center', padding: '32px 0' }}>아직 남긴 이야기가 없어요.</p>
        ) : threads.map(t => {
          const isReplied = t.status === 'replied';
          return (
            <div key={t.id} onClick={() => goThread(t)} style={{ background: C.paper, border: `1px solid ${isReplied ? '#272725' : C.line}`, borderRadius: '11px', padding: '10px 11px', marginBottom: '7px', cursor: 'pointer', position: 'relative', boxShadow: '0 3px 8px rgba(38,37,34,.03)' }}>
              <div style={{ position: 'absolute', top: '-5px', left: '14px', width: '30px', height: '9px', borderRadius: '2px', background: 'rgba(198,188,170,.52)' }} />
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: '6px', marginBottom: '4px' }}>
                <span style={{ fontSize: '9px', color: '#ada497' }}>{fmt(t.updatedAt)}</span>
                <span style={{ fontSize: '9px', fontWeight: '700', padding: '2px 6px', borderRadius: '999px', background: isReplied ? '#272725' : '#f4ede4', color: isReplied ? '#f8f4ed' : '#878075', border: isReplied ? 'none' : `1px dashed #d3c9bd` }}>
                  {isReplied ? '답장 도착' : '받았어요'}
                </span>
              </div>
              <p style={{ fontSize: '13px', fontWeight: '300', color: '#2b2a28', lineHeight: '1.7', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{t.lastMessage}</p>
            </div>
          );
        })}

        <button style={{ ...btnFill, marginTop: '12px' }} onClick={() => setView('write')}>오늘도 남기기</button>
      </div>
    </div>
  );
}

// ── 대화 스레드 ──────────────────────────────
function Thread({ thread, setView }) {
  const [msgs, setMsgs] = useState([]);
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef(null);

  useEffect(() => {
    if (!thread) return;
    return subscribeMessages(thread.id, (m) => { setMsgs(m); setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 100); });
  }, [thread]);

  const send = async () => {
    if (!content.trim()) return;
    setLoading(true);
    await addMessage(thread.id, content, 'user');
    setContent('');
    setLoading(false);
  };

  return (
    <div style={{ ...pageStyle, display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <div style={{ padding: '14px 18px', borderBottom: `1px solid ${C.line}`, background: C.bg, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <button onClick={() => setView('home')} style={{ background: 'none', border: 'none', fontSize: '12px', color: '#938a80', cursor: 'pointer' }}>← 내 공간</button>
      </div>

      <div style={{ flex: 1, padding: '12px 16px', overflowY: 'auto' }}>
        {msgs.map(m => (
          <div key={m.id} style={{ display: 'flex', justifyContent: m.role === 'user' ? 'flex-end' : 'flex-start', marginBottom: '10px' }}>
            <div style={{ maxWidth: '74%', background: m.role === 'user' ? C.paper : '#242420', border: m.role === 'user' ? `1px solid ${C.line}` : 'none', borderRadius: '11px', padding: '9px 11px', position: 'relative' }}>
              <div style={{ position: 'absolute', top: '-4px', [m.role === 'user' ? 'right' : 'left']: '10px', width: '24px', height: '7px', borderRadius: '2px', background: m.role === 'user' ? 'rgba(198,188,170,.52)' : 'rgba(255,255,255,.17)' }} />
              {m.role === 'admin' && <div style={{ fontSize: '9px', fontWeight: '700', letterSpacing: '.08em', color: '#d7cfbf', marginBottom: '3px' }}>마인드포스팃</div>}
              <p style={{ fontSize: '12px', fontWeight: '300', lineHeight: '1.75', color: m.role === 'user' ? C.ink : '#f8f4ec', wordBreak: 'keep-all' }}>{m.content}</p>
              <p style={{ fontSize: '8px', color: m.role === 'user' ? '#b3aa9e' : '#beb5a7', marginTop: '5px', textAlign: m.role === 'user' ? 'right' : 'left' }}>{fmt(m.createdAt)}</p>
            </div>
          </div>
        ))}

        {thread.status === 'waiting' && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '7px', padding: '9px 11px', border: `1px dashed ${C.line}`, borderRadius: '10px', background: '#f7f1e8', marginBottom: '10px' }}>
            <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#beb4a9', animation: 'pulse 2s ease-in-out infinite', flexShrink: 0 }} />
            <span style={{ fontSize: '11px', color: '#8a8278' }}>직접 읽고 있어요. 조금 뒤 답장을 남겨둘게요.</span>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      <div style={{ borderTop: `1px solid #ddd4c8`, padding: '10px 16px 20px', background: C.bg }}>
        <textarea
          value={content} onChange={e => setContent(e.target.value)}
          placeholder="한두 문장으로 이어서 남겨도 충분해요"
          rows={3}
          style={{ width: '100%', background: C.paper, border: `1px solid ${C.line}`, borderRadius: '10px', padding: '9px 11px', fontSize: '13px', lineHeight: '1.7', color: C.ink, resize: 'none', outline: 'none', fontFamily: "'Noto Sans KR', sans-serif", marginBottom: '7px' }}
        />
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: '10px', lineHeight: '1.45', color: '#a2988d' }}>한두 문장으로 이어서 남겨도 충분해요</span>
          <button onClick={send} disabled={!content.trim() || loading} style={{ padding: '7px 16px', border: 'none', borderRadius: '9px', background: C.ink, color: '#f8f4ed', fontSize: '11px', fontWeight: '800', cursor: 'pointer', opacity: (!content.trim() || loading) ? 0.5 : 1, fontFamily: "'Noto Sans KR', sans-serif" }}>남기기</button>
        </div>
      </div>
      <style>{`@keyframes pulse{0%,100%{opacity:.35}50%{opacity:1}}`}</style>
    </div>
  );
}

// ── 관리자 뷰 ────────────────────────────────
function AdminView({ user, setUser, setView }) {
  const [threads, setThreads] = useState([]);
  const [tab, setTab] = useState('inbox');
  const [selected, setSelected] = useState(null);

  useEffect(() => subscribeAllThreads(setThreads), []);

  const doLogout = async () => { await logOut(); setUser(null); setView('splash'); };

  const waiting = threads.filter(t => t.status === 'waiting' && !t.isAlert);
  const alerts = threads.filter(t => t.isAlert);
  const done = threads.filter(t => t.status === 'replied' && !t.isAlert);

  if (selected) return <AdminThread thread={selected} onBack={() => setSelected(null)} />;

  return (
    <div style={{ ...pageStyle, padding: '18px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', maxWidth: '420px', margin: '0 auto 14px', paddingBottom: '12px', borderBottom: `1px solid ${C.line}` }}>
        <div>
          <div style={{ fontSize: '15px', fontWeight: '900', color: C.ink }}>받은 이야기</div>
          <div style={{ fontSize: '10px', color: C.muted, marginTop: '2px' }}>쌓인 이야기를 확인하고 회신한다.</div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '6px' }}>
          <div style={{ display: 'flex', gap: '5px' }}>
            <span style={{ background: C.ink, color: '#f8f4ed', fontSize: '9px', fontWeight: '800', padding: '3px 8px', borderRadius: '999px' }}>미답장 {waiting.length}</span>
            {alerts.length > 0 && <span style={{ background: '#f0e0d0', border: '1px solid #d4a898', color: '#7a6050', fontSize: '9px', fontWeight: '800', padding: '3px 8px', borderRadius: '999px' }}>주의 {alerts.length}</span>}
          </div>
          <button onClick={doLogout} style={{ fontSize: '10px', color: C.soft, background: 'none', border: 'none', cursor: 'pointer' }}>로그아웃</button>
        </div>
      </div>

      {/* 탭 */}
      <div style={{ display: 'flex', gap: '4px', padding: '3px', background: '#e9e0d3', borderRadius: '9px', marginBottom: '12px', maxWidth: '420px', margin: '0 auto 12px' }}>
        {[['inbox', '받은 글'], ['members', '회원'], ['alert', '주의']].map(([k, l]) => (
          <button key={k} onClick={() => setTab(k)} style={{ flex: 1, padding: '6px 0', border: 'none', borderRadius: '7px', fontSize: '11px', fontWeight: '800', cursor: 'pointer', fontFamily: "'Noto Sans KR', sans-serif", background: tab === k ? C.ink : 'transparent', color: tab === k ? '#f9f5ee' : C.muted }}>{l}</button>
        ))}
      </div>

      <div style={{ maxWidth: '420px', margin: '0 auto' }}>
        {tab === 'inbox' && (
          <>
            {alerts.map(t => <ACard key={t.id} t={t} isAlert onClick={() => setSelected(t)} />)}
            {waiting.map(t => <ACard key={t.id} t={t} onClick={() => setSelected(t)} />)}
            {done.map(t => <ACard key={t.id} t={t} isDone onClick={() => setSelected(t)} />)}
            {threads.length === 0 && <p style={{ fontSize: '12px', color: C.soft, textAlign: 'center', padding: '32px 0' }}>아직 들어온 이야기가 없어요.</p>}
          </>
        )}
        {tab === 'members' && (
          [...new Map(threads.map(t => [t.userId, t])).values()].map(t => {
            const ut = threads.filter(x => x.userId === t.userId);
            const hasNew = ut.some(x => x.status === 'waiting');
            const isAnon = t.isAnonymous;
            // 유저 식별자: 익명이면 "익명", 아니면 userId 앞 8자
            const displayId = isAnon ? '익명' : `회원 ${t.userId?.slice(0, 8)}...`;
            const avatar = isAnon ? '익' : t.userId?.slice(0, 1).toUpperCase();
            // 마지막 메시지: 준의 답장이 아니라 유저 글만 보여줘야 함
            const userThreads = ut.sort((a, b) => (b.updatedAt?.seconds || 0) - (a.updatedAt?.seconds || 0));
            const latestThread = userThreads[0];

            return (
              <div key={t.userId} style={{ display: 'flex', gap: '9px', alignItems: 'flex-start', background: C.paper, border: `1px solid ${hasNew ? C.ink : C.line}`, borderRadius: '11px', padding: '10px 11px', marginBottom: '7px' }}>
                <div onClick={() => setSelected(latestThread)} style={{ width: '30px', height: '30px', borderRadius: '50%', background: hasNew ? C.ink : '#e9dfd2', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', fontWeight: '800', color: hasNew ? '#f8f4ed' : '#5a544c', flexShrink: 0, cursor: 'pointer' }}>{avatar}</div>
                <div onClick={() => setSelected(latestThread)} style={{ flex: 1, minWidth: 0, cursor: 'pointer' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2px' }}>
                    <span style={{ fontSize: '11px', fontWeight: '700', color: C.ink }}>{displayId}</span>
                    <span style={{ fontSize: '9px', color: '#ada497' }}>{fmt(t.updatedAt)}</span>
                  </div>
                  <p style={{ fontSize: '10px', color: C.muted, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{latestThread?.lastMessage}</p>
                  <span style={{ display: 'inline-block', marginTop: '3px', padding: '2px 6px', borderRadius: '999px', background: '#ece4d8', border: '1px solid #dad1c3', fontSize: '9px', fontWeight: '700', color: '#6f675e' }}>{hasNew ? '미답장' : '완료'} · {ut.length}건</span>
                </div>
                <button
                  onClick={async (e) => { e.stopPropagation(); if (!window.confirm(`${displayId}의 모든 글을 삭제할까요?`)) return; for (const th of ut) { await deleteThread(th.id); } }}
                  style={{ fontSize: '11px', color: '#c0a09a', background: 'none', border: 'none', cursor: 'pointer', padding: '0 2px', flexShrink: 0, alignSelf: 'flex-start', marginTop: '2px' }}
                >✕</button>
              </div>
            );
          })
        )}
        {tab === 'alert' && (
          alerts.length === 0
            ? <p style={{ fontSize: '12px', color: C.soft, textAlign: 'center', padding: '32px 0' }}>주의 글이 없어요.</p>
            : alerts.map(t => <ACard key={t.id} t={t} isAlert onClick={() => setSelected(t)} />)
        )}
      </div>
    </div>
  );
}

function ACard({ t, onClick, isAlert, isDone }) {
  return (
    <div onClick={onClick} style={{ background: C.paper, border: `1px solid ${isAlert ? '#d4a898' : isDone ? C.line : C.ink}`, borderRadius: '11px', padding: '9px 11px', marginBottom: '7px', cursor: 'pointer', boxShadow: '0 2px 6px rgba(38,37,34,.03)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: '6px', marginBottom: '4px' }}>
        <span style={{ fontSize: '9px', color: '#ada497' }}>{fmt(t.updatedAt)}</span>
        <span style={{ fontSize: '9px', fontWeight: '800', padding: '2px 7px', borderRadius: '999px', whiteSpace: 'nowrap', background: isAlert ? '#f0e0d0' : isDone ? '#e8e0d5' : C.ink, border: isAlert ? '1px solid #d4a898' : isDone ? '1px solid #cfc7bb' : 'none', color: isAlert ? '#7a6050' : isDone ? '#7a7268' : '#f8f4ed' }}>
          {isAlert ? '주의 확인' : isDone ? '답장 완료' : '새 글'}
        </span>
      </div>
      <p style={{ fontSize: '12px', lineHeight: '1.7', color: C.ink, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{t.lastMessage}</p>
      <p style={{ fontSize: '9px', color: C.muted, marginTop: '3px' }}>{t.isAnonymous ? '익명' : '로그인 회원'}</p>
    </div>
  );
}

// ── 관리자 답장 화면 ─────────────────────────
function AdminThread({ thread, onBack }) {
  const [msgs, setMsgs] = useState([]);
  const [reply, setReply] = useState('');
  const [loading, setLoading] = useState(false);
  const [isAlert, setIsAlert] = useState(thread.isAlert || false);
  const bottomRef = useRef(null);

  useEffect(() => {
    return subscribeMessages(thread.id, (m) => { setMsgs(m); setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 100); });
  }, [thread]);

  const send = async () => {
    if (!reply.trim()) return;
    setLoading(true);
    await addMessage(thread.id, reply, 'admin');
    setReply('');
    setLoading(false);
  };

  const toggleAlert = async () => {
    const next = !isAlert;
    await setThreadAlert(thread.id, next);
    setIsAlert(next);
  };

  const userCount = msgs.filter(m => m.role === 'user').length;

  return (
    <div style={{ ...pageStyle, display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <div style={{ padding: '13px 18px', borderBottom: `1px solid ${C.line}`, background: C.bg, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <button onClick={onBack} style={{ background: 'none', border: 'none', fontSize: '12px', color: '#938a80', cursor: 'pointer' }}>← 받은 이야기</button>
        <button onClick={toggleAlert} style={{ fontSize: '10px', fontWeight: '700', padding: '5px 12px', borderRadius: '999px', border: 'none', cursor: 'pointer', background: isAlert ? '#f0e0d0' : '#e9e0d3', color: isAlert ? '#7a6050' : C.muted, fontFamily: "'Noto Sans KR', sans-serif" }}>{isAlert ? '⚠️ 주의 해제' : '주의 설정'}</button>
      </div>

      <div style={{ flex: 1, padding: '12px 16px', overflowY: 'auto', maxWidth: '440px', margin: '0 auto', width: '100%' }}>
        {/* 맥락 패널 */}
        <div style={{ background: '#f7f0e5', border: `1px solid ${C.line}`, borderRadius: '11px', padding: '9px 11px', marginBottom: '12px' }}>
          <div style={{ fontSize: '9px', letterSpacing: '.08em', color: '#9b9287', marginBottom: '3px' }}>회원 {thread.userId?.slice(0, 8)}...</div>
          <div style={{ fontSize: '12px', fontWeight: '800' }}>{userCount}번째 이야기 · {thread.isAnonymous ? '익명' : '로그인 회원'}</div>
          <div style={{ fontSize: '10px', color: '#7d756b', marginTop: '3px', lineHeight: '1.6' }}>짧고 일관된 공감형 답장. 해석을 늘리기보다, 먼저 읽고 이해한 흔적을 남긴다.</div>
        </div>

        {/* 원문 */}
        <div style={{ background: C.paper, border: `1px solid ${C.line}`, borderRadius: '11px', padding: '9px 11px', marginBottom: '12px' }}>
          <div style={{ fontSize: '9px', letterSpacing: '.08em', color: '#a1988c', marginBottom: '4px' }}>사용자 원문</div>
          <div style={{ fontSize: '13px', lineHeight: '1.75', color: '#393632' }}>{thread.lastMessage}</div>
        </div>

        {/* 메시지 */}
        {msgs.map(m => (
          <div key={m.id} style={{ display: 'flex', justifyContent: m.role === 'user' ? 'flex-end' : 'flex-start', marginBottom: '10px' }}>
            <div style={{ maxWidth: '76%', background: m.role === 'user' ? C.paper : '#242420', border: m.role === 'user' ? `1px solid ${C.line}` : 'none', borderRadius: '11px', padding: '9px 11px', position: 'relative' }}>
              <div style={{ position: 'absolute', top: '-4px', [m.role === 'user' ? 'right' : 'left']: '10px', width: '24px', height: '7px', borderRadius: '2px', background: m.role === 'user' ? 'rgba(198,188,170,.52)' : 'rgba(255,255,255,.17)' }} />
              {m.role === 'admin' && <div style={{ fontSize: '9px', fontWeight: '700', letterSpacing: '.08em', color: '#d7cfbf', marginBottom: '3px' }}>준 (나)</div>}
              <p style={{ fontSize: '12px', fontWeight: '300', lineHeight: '1.8', color: m.role === 'user' ? C.ink : '#f8f4ec', wordBreak: 'keep-all' }}>{m.content}</p>
              <p style={{ fontSize: '8px', color: m.role === 'user' ? '#b3aa9e' : '#beb5a7', marginTop: '4px', textAlign: m.role === 'user' ? 'right' : 'left' }}>{fmt(m.createdAt)}</p>
            </div>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      <div style={{ borderTop: `1px solid #ddd4c8`, padding: '12px 18px 24px', background: C.bg, maxWidth: '440px', margin: '0 auto', width: '100%' }}>
        <div style={{ fontSize: '9px', letterSpacing: '.08em', color: '#a1988c', marginBottom: '8px' }}>답장 초안</div>
        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: '8px' }}>
          {['공감 1문장', '재반영 1문장', '부담 없는 초대'].map(q => (
            <span key={q} style={{ padding: '4px 8px', borderRadius: '999px', background: '#f0e7db', border: '1px solid #ddd1c3', fontSize: '10px', color: '#6d665d' }}>{q}</span>
          ))}
        </div>
        <textarea value={reply} onChange={e => setReply(e.target.value)} placeholder="공감 → 재반영 → 부담 없는 초대 순서로" rows={4} style={{ width: '100%', background: C.paper, border: `1px solid ${C.line}`, borderRadius: '10px', padding: '10px 11px', fontSize: '13px', lineHeight: '1.75', color: C.ink, resize: 'none', outline: 'none', fontFamily: "'Noto Sans KR', sans-serif", marginBottom: '8px' }} />
        <div style={{ display: 'flex', gap: '8px' }}>
          <button onClick={send} disabled={!reply.trim() || loading} style={{ ...btnFill, opacity: (!reply.trim() || loading) ? 0.5 : 1 }}>{loading ? '보내는 중...' : '답장 보내기'}</button>
          <button onClick={toggleAlert} style={{ ...btnOutline, width: 'auto', padding: '10px 14px', whiteSpace: 'nowrap', fontSize: '11px' }}>{isAlert ? '주의 해제' : '주의 문구로 전환'}</button>
        </div>
      </div>
    </div>
  );
}
