import React, { useState, useEffect, useRef } from 'react';
import Intro from './Intro';
import {
  signInAnon, signUpWithEmail, signInWithEmail, resetPassword, logOut,
  onAuthChange, createThread, addMessage, subscribeMessages,
  subscribeUserThreads, subscribeAllThreads, setThreadAlert
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
  const [view, setView] = useState('intro');
  const [currentThread, setCurrentThread] = useState(null);
  const [prevView, setPrevView] = useState('intro');

  useEffect(() => {
    const unsub = onAuthChange((u) => { setUser(u); setAuthReady(true); });
    return unsub;
  }, []);

  useEffect(() => {
    if (authReady && !user) signInAnon();
  }, [authReady, user]);

  const goThread = (t) => { setCurrentThread(t); setView('thread'); };
  const goLogin = (from) => { setPrevView(from); setView('login'); };

  if (!authReady) return (
    <div style={{ ...pageStyle, ...centerStyle }}>
      <p style={{ fontSize: '13px', fontWeight: '300', color: C.soft }}>잠깐만요...</p>
    </div>
  );

  if (user && isAdmin(user)) return <AdminView user={user} setUser={setUser} />;

  return (
    <div style={pageStyle}>
      {view === 'intro' && <Intro setView={setView} user={user} setPrevView={setPrevView} />}
      {view === 'splash' && <Splash setView={setView} user={user} />}
      {view === 'write' && <Write user={user} setView={setView} />}
      {view === 'done' && <Done setView={setView} setPrevView={setPrevView} />}
      {view === 'login' && <Login setView={setView} setUser={setUser} prevView={prevView} />}
      {view === 'signup' && <Signup setView={setView} setUser={setUser} />}
      {view === 'home' && <Home user={user} setView={setView} setUser={setUser} goThread={goThread} />}
      {view === 'thread' && <Thread thread={currentThread} setView={setView} />}
    </div>
  );
}

// ── 스플래시 ─────────────────────────────────
function Splash({ setView, user }) {
  return (
    <div style={{ ...pageStyle, ...centerStyle }}>
      <div style={{ textAlign: 'center', marginBottom: '32px' }}>
        <div style={{ fontSize: '11px', fontWeight: '900', letterSpacing: '.22em', color: '#a29789', marginBottom: '22px' }}>마인드포스팃</div>
        <h1 style={{ fontSize: '26px', fontWeight: '900', letterSpacing: '-.04em', lineHeight: '1.5', color: C.ink, marginBottom: '0' }}>
          어떤 이야기든,<br />여기선 괜찮아요.
        </h1>
        <div style={{ width: '1px', height: '22px', background: '#c0b6a8', margin: '14px auto' }} />
        <p style={{ fontSize: '14px', fontWeight: '300', lineHeight: '1.8', color: '#7a7168' }}>충분히 들어줄게요.</p>
      </div>

      <div style={{ width: '100%', maxWidth: '290px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
        <button style={btnFill} onClick={() => setView('write')}>지금 남기기</button>
        <button style={btnOutline} onClick={() => setView(user && !user.isAnonymous ? 'home' : 'login')}>로그인 · 나만의 공간</button>
        <button style={btnSoft} onClick={() => setView('intro')}>먼저 둘러보기</button>
      </div>

      <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', justifyContent: 'center', marginTop: '16px' }}>
        {['익명 가능', 'AI 아님', '아침 답장'].map(t => (
          <span key={t} style={{ padding: '4px 9px', borderRadius: '999px', border: `1px solid ${C.line}`, background: '#f7f0e7', fontSize: '11px', color: '#6d665d' }}>{t}</span>
        ))}
      </div>
      <p style={{ marginTop: '12px', fontSize: '11px', color: C.soft }}>익명으로 시작해도 괜찮아요.</p>
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
          onChange={e => setContent(e.target.value)}
          placeholder={placeholder}
          rows={7}
          style={{ width: '100%', background: '#f8f2e8', border: `1px solid ${C.line}`, borderRadius: '9px', padding: '10px', fontSize: '12px', lineHeight: '1.75', color: '#4d4943', resize: 'none', outline: 'none', fontFamily: "'Noto Sans KR', sans-serif", marginBottom: '8px' }}
        />

        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', color: '#9b9287', marginBottom: '10px' }}>
          <span>이름 없이 남길 수 있어요</span>
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
          이름 없이 남고 · 하루가 지나면 사라져요.
          {(!user || user.isAnonymous) && (
            <><br /><span
              onClick={() => setView('login')}
              style={{ textDecoration: 'underline', color: '#888', cursor: 'pointer' }}
            >로그인하면 내 이야기와 공간이 생겨요.</span></>
          )}
        </div>
      </div>
    </div>
  );
}

// ── 전송 완료 ────────────────────────────────
function Done({ setView, setPrevView }) {
  return (
    <div style={{ ...pageStyle, ...centerStyle }}>
      <div style={{ width: '130px', margin: '0 auto 16px', background: C.paper, border: `1px solid ${C.line}`, borderRadius: '10px', padding: '12px 10px', transform: 'rotate(-2deg)', position: 'relative', boxShadow: '0 4px 10px rgba(38,37,34,.06)' }}>
        <div style={{ position: 'absolute', top: '-6px', left: '50%', transform: 'translateX(-50%)', width: '38px', height: '11px', borderRadius: '2px', background: 'rgba(198,188,170,.52)' }} />
        <p style={{ fontSize: '11px', lineHeight: '1.7', color: '#5a554e' }}>방금 남긴 이야기가 안전하게 전달됐어요.</p>
        <small style={{ display: 'block', marginTop: '6px', fontSize: '9px', color: '#b0a79c' }}>{new Date().toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })} · 오늘</small>
      </div>

      <h2 style={{ fontSize: '20px', fontWeight: '900', textAlign: 'center', letterSpacing: '-.02em', marginBottom: '6px' }}>남겨줘서 고마워요.</h2>
      <p style={{ fontSize: '12px', lineHeight: '1.75', textAlign: 'center', color: C.muted, marginBottom: '14px' }}>
        오늘 밤 남긴 이야기는<br />아침 6–7시에 차분히 읽고<br />짧게 답장을 남겨둘게요.
      </p>

      <div style={{ display: 'flex', alignItems: 'center', gap: '5px', marginBottom: '16px', width: '100%', maxWidth: '280px' }}>
        <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: C.ink, flexShrink: 0 }} />
        <div style={{ flex: 1, height: '1px', background: '#d7cec1' }} />
        <span style={{ fontSize: '10px', color: '#6e665c', fontWeight: '700', whiteSpace: 'nowrap' }}>답장 예정</span>
        <div style={{ flex: 1, height: '1px', background: '#d7cec1' }} />
        <span style={{ fontSize: '10px', color: '#9a9086', whiteSpace: 'nowrap' }}>06–07시</span>
      </div>

      <div style={{ width: '100%', maxWidth: '290px', display: 'flex', flexDirection: 'column', gap: '7px' }}>
        <button style={btnFill} onClick={() => { setPrevView && setPrevView('done'); setView('signup'); }}>회원가입하고 답장 받기</button>
        <button style={btnOutline} onClick={() => { setPrevView('done'); setView('login'); }}>이미 계정이 있어요</button>
        <button style={btnSoft} onClick={() => setView('splash')}>처음으로</button>
      </div>

      <p style={{ marginTop: '12px', fontSize: '10px', lineHeight: '1.65', textAlign: 'center', color: '#9a9186' }}>AI가 아니라, 진짜 사람이 직접 읽고 남기는 답장이에요.</p>
    </div>
  );
}

// ── 로그인 ───────────────────────────────────
function Login({ setView, setUser, prevView = 'intro' }) {
  const [email, setEmail] = useState('');
  const [pw, setPw] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [resetSent, setResetSent] = useState(false);

  const doLogin = async () => {
    if (!email || !pw) { setError('이메일과 비밀번호를 입력해줘요.'); return; }
    setLoading(true); setError('');
    const r = await signInWithEmail(email, pw);
    if (r.success) { setUser(r.user); setView('home'); }
    else setError(r.message);
    setLoading(false);
  };

  const doReset = async () => {
    if (!email) { setError('이메일을 먼저 입력해줘요.'); return; }
    const r = await resetPassword(email);
    if (r.success) setResetSent(true);
    else setError('비밀번호 재설정 이메일 전송에 실패했어요.');
  };

  return (
    <div style={{ ...pageStyle, ...centerStyle }}>
      <button onClick={() => setView(prevView)} style={{ position: 'absolute', top: '24px', left: '24px', background: 'none', border: 'none', fontSize: '12px', color: C.soft, cursor: 'pointer' }}>← 돌아가기</button>

      <div style={{ background: C.paper, border: `1px solid ${C.line}`, borderRadius: '14px', padding: '16px 14px', width: '100%', maxWidth: '340px' }}>
        <div style={{ fontSize: '15px', fontWeight: '800', lineHeight: '1.45', marginBottom: '4px' }}>답장을 놓치지 않으려면</div>
        <div style={{ fontSize: '11px', lineHeight: '1.7', color: C.muted, marginBottom: '14px' }}>로그인하면 사람이 직접 남긴 답장을 놓치지 않고, 내 이야기와 답장이 내 공간에 남아요.</div>

        <div style={{ marginBottom: '8px' }}>
          <label style={{ display: 'block', fontSize: '10px', fontWeight: '800', letterSpacing: '.08em', color: '#6f675d', marginBottom: '4px' }}>이메일</label>
          <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="hello@email.com" style={inputStyle} />
        </div>
        <div style={{ marginBottom: '4px' }}>
          <label style={{ display: 'block', fontSize: '10px', fontWeight: '800', letterSpacing: '.08em', color: '#6f675d', marginBottom: '4px' }}>비밀번호</label>
          <input type="password" value={pw} onChange={e => setPw(e.target.value)} placeholder="••••••••" style={inputStyle} onKeyDown={e => e.key === 'Enter' && doLogin()} />
        </div>
        <div style={{ textAlign: 'right', marginBottom: '12px' }}>
          <button onClick={doReset} style={{ fontSize: '10px', color: '#aba295', background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline', textUnderlineOffset: '2px' }}>비밀번호 찾기</button>
        </div>

        {resetSent && <p style={{ fontSize: '11px', color: '#2a7a2a', marginBottom: '8px', textAlign: 'center' }}>재설정 이메일을 보냈어요.</p>}
        {error && <p style={{ fontSize: '11px', color: '#d4433a', marginBottom: '8px', textAlign: 'center' }}>{error}</p>}

        <button style={{ ...btnFill, opacity: loading ? 0.6 : 1, marginBottom: '12px' }} onClick={doLogin} disabled={loading}>{loading ? '로그인 중...' : '로그인'}</button>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
          <div style={{ flex: 1, height: '1px', background: '#d8cfc3' }} />
          <span style={{ fontSize: '10px', color: '#aba295' }}>처음이라면</span>
          <div style={{ flex: 1, height: '1px', background: '#d8cfc3' }} />
        </div>
        <button style={{ ...btnOutline, marginBottom: '12px' }} onClick={() => setView('signup')}>회원가입</button>

        <div style={{ background: '#f9f3eb', border: `1px solid ${C.line}`, borderRadius: '11px', padding: '9px 10px' }}>
          <div style={{ fontSize: '11px', fontWeight: '800', marginBottom: '4px' }}>가입하면 달라지는 것</div>
          <div style={{ fontSize: '10px', lineHeight: '1.65', color: '#7d756b' }}>답장 확인 · 대화 보관 · 이어서 남기기</div>
          <div style={{ display: 'flex', gap: '6px', marginTop: '8px' }}>
            {[['답장', '아침 확인'], ['기록', '내 공간 저장']].map(([k, v]) => (
              <div key={k} style={{ flex: 1, padding: '6px 8px', borderRadius: '9px', border: '1px solid #e1d6c9', background: '#fffaf3' }}>
                <div style={{ fontSize: '9px', color: '#978d82' }}>{k}</div>
                <div style={{ fontSize: '12px', fontWeight: '800', marginTop: '1px', color: '#33312e' }}>{v}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ── 회원가입 ─────────────────────────────────
function Signup({ setView, setUser }) {
  const [email, setEmail] = useState('');
  const [pw, setPw] = useState('');
  const [pw2, setPw2] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const doSignup = async () => {
    if (!email || !pw) { setError('이메일과 비밀번호를 입력해줘요.'); return; }
    if (pw !== pw2) { setError('비밀번호가 일치하지 않아요.'); return; }
    if (pw.length < 6) { setError('비밀번호는 6자 이상이어야 해요.'); return; }
    setLoading(true); setError('');
    const r = await signUpWithEmail(email, pw);
    if (r.success) { setUser(r.user); setView('home'); }
    else setError(r.message);
    setLoading(false);
  };

  return (
    <div style={{ ...pageStyle, ...centerStyle }}>
      <button onClick={() => setView('login')} style={{ position: 'absolute', top: '24px', left: '24px', background: 'none', border: 'none', fontSize: '12px', color: C.soft, cursor: 'pointer' }}>← 돌아가기</button>

      <div style={{ background: C.paper, border: `1px solid ${C.line}`, borderRadius: '14px', padding: '16px 14px', width: '100%', maxWidth: '340px' }}>
        <div style={{ fontSize: '15px', fontWeight: '800', marginBottom: '4px' }}>처음이군요.</div>
        <div style={{ fontSize: '11px', lineHeight: '1.7', color: C.muted, marginBottom: '14px' }}>닉네임 없이, 이메일만으로 충분해요.</div>

        {[['이메일', 'email', email, setEmail, 'hello@email.com'], ['비밀번호', 'password', pw, setPw, '6자 이상'], ['비밀번호 확인', 'password', pw2, setPw2, '한 번 더']].map(([label, type, val, setter, ph]) => (
          <div key={label} style={{ marginBottom: '8px' }}>
            <label style={{ display: 'block', fontSize: '10px', fontWeight: '800', letterSpacing: '.08em', color: '#6f675d', marginBottom: '4px' }}>{label}</label>
            <input type={type} value={val} onChange={e => setter(e.target.value)} placeholder={ph} style={inputStyle} onKeyDown={e => e.key === 'Enter' && doSignup()} />
          </div>
        ))}

        {error && <p style={{ fontSize: '11px', color: '#d4433a', margin: '8px 0', textAlign: 'center' }}>{error}</p>}

        <button style={{ ...btnFill, marginTop: '6px', opacity: loading ? 0.6 : 1 }} onClick={doSignup} disabled={loading}>{loading ? '가입 중...' : '가입하기'}</button>
        <p style={{ fontSize: '10px', color: '#9a9186', textAlign: 'center', marginTop: '10px' }}>가입하면 이용약관에 동의한 것으로 간주돼요.</p>
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
    ? { style: { background: '#f4ede4', border: `1px dashed #d3c9bd` }, title: '받았어요.', sub: '아침 6–7시에 차분히 읽고 답장을 남길게요.', tc: '#5a5349', sc: '#8a8278' }
    : { style: { background: 'linear-gradient(180deg,#fcf8f2 0%,#f4ebdf 100%)', border: `1px solid ${C.line}` }, title: '오늘 하루 어땠어요?', sub: '여기다 두고 가도 괜찮아요.', tc: '#403c37', sc: '#7d756b' };

  return (
    <div style={{ ...pageStyle, padding: '18px 18px 40px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', maxWidth: '380px', margin: '0 auto 14px' }}>
        <span style={{ fontSize: '12px', fontWeight: '900', letterSpacing: '.14em', color: '#847b71' }}>마인드포스팃</span>
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
function AdminView({ user, setUser }) {
  const [threads, setThreads] = useState([]);
  const [tab, setTab] = useState('inbox');
  const [selected, setSelected] = useState(null);

  useEffect(() => subscribeAllThreads(setThreads), []);

  const doLogout = async () => { await logOut(); setUser(null); };

  const waiting = threads.filter(t => t.status === 'waiting' && !t.isAlert);
  const alerts = threads.filter(t => t.isAlert);
  const done = threads.filter(t => t.status === 'replied' && !t.isAlert);

  if (selected) return <AdminThread thread={selected} onBack={() => setSelected(null)} />;

  return (
    <div style={{ ...pageStyle, padding: '18px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', maxWidth: '420px', margin: '0 auto 14px', paddingBottom: '12px', borderBottom: `1px solid ${C.line}` }}>
        <div>
          <div style={{ fontSize: '15px', fontWeight: '900', color: C.ink }}>받은 이야기</div>
          <div style={{ fontSize: '10px', color: C.muted, marginTop: '2px' }}>밤사이 쌓인 이야기를 아침 6–7시에 확인하고 회신한다.</div>
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
            return (
              <div key={t.userId} onClick={() => setSelected(t)} style={{ display: 'flex', gap: '9px', alignItems: 'flex-start', background: C.paper, border: `1px solid ${hasNew ? C.ink : C.line}`, borderRadius: '11px', padding: '10px 11px', marginBottom: '7px', cursor: 'pointer' }}>
                <div style={{ width: '30px', height: '30px', borderRadius: '50%', background: hasNew ? C.ink : '#e9dfd2', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', fontWeight: '800', color: hasNew ? '#f8f4ed' : '#5a544c', flexShrink: 0 }}>{t.userId?.slice(0, 1).toUpperCase()}</div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2px' }}>
                    <span style={{ fontSize: '11px', fontWeight: '700', color: C.ink }}>{t.userId?.slice(0, 10)}...</span>
                    <span style={{ fontSize: '9px', color: '#ada497' }}>{fmt(t.updatedAt)}</span>
                  </div>
                  <p style={{ fontSize: '10px', color: C.muted, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{t.lastMessage}</p>
                  <span style={{ display: 'inline-block', marginTop: '3px', padding: '2px 6px', borderRadius: '999px', background: '#ece4d8', border: '1px solid #dad1c3', fontSize: '9px', fontWeight: '700', color: '#6f675e' }}>{hasNew ? '미답장' : '완료'} · {ut.length}건</span>
                </div>
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
