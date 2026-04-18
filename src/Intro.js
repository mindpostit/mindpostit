import React, { useRef } from 'react';

export default function Intro({ setView, user }) {
  const introRef = useRef(null);
  const flowRef = useRef(null);

  const scrollTo = (ref) => ref.current?.scrollIntoView({ behavior: 'smooth' });

  const goWrite = () => setView('write');
  const goLogin = () => setView(user && !user.isAnonymous ? 'home' : 'login');

  return (
    <div style={{ fontFamily: "'Noto Sans KR', sans-serif", color: '#262522', background: 'linear-gradient(180deg,#f6f1ea 0%,#efe8de 100%)', minHeight: '100vh' }}>

      {/* 헤더 */}
      <header style={{ position: 'sticky', top: 0, zIndex: 20, background: 'rgba(245,240,234,.94)', backdropFilter: 'blur(12px)', borderBottom: '1px solid rgba(217,208,195,.85)' }}>
        <nav style={{ maxWidth: '1360px', margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '18px 28px', gap: '16px', flexWrap: 'wrap' }}>
          <div style={{ fontSize: '14px', fontWeight: '900', letterSpacing: '.22em', color: '#7b7368' }}>마인드포스팃</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '22px', flexWrap: 'wrap', justifyContent: 'flex-end' }}>
            <a onClick={() => scrollTo(introRef)} href="#" style={{ color: '#6e665d', textDecoration: 'none', fontSize: '14px', fontWeight: '600' }}>소개</a>
            <a onClick={() => scrollTo(flowRef)} href="#" style={{ color: '#6e665d', textDecoration: 'none', fontSize: '14px', fontWeight: '600' }}>이용 흐름</a>
            <button onClick={goWrite} style={{ padding: '14px 22px', borderRadius: '999px', background: '#23231f', color: '#f8f5ef', border: 'none', cursor: 'pointer', fontSize: '14px', fontWeight: '800', fontFamily: "'Noto Sans KR', sans-serif", boxShadow: '0 10px 24px rgba(35,35,31,.16)' }}>지금 남기기</button>
          </div>
        </nav>
      </header>

      <main>
        {/* 히어로 */}
        <section ref={introRef} style={{ minHeight: 'calc(100vh - 82px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '54px 24px 64px', background: 'radial-gradient(circle at 50% 45%, rgba(255,255,255,.70), rgba(255,255,255,0) 42%)' }}>
          <div style={{ width: 'min(100%, 700px)', background: 'rgba(255,255,255,.65)', border: '1px solid rgba(255,255,255,.82)', borderRadius: '42px', padding: '48px 42px 36px', boxShadow: '0 28px 80px rgba(38,37,34,.10)', textAlign: 'center' }}>
            <div style={{ fontSize: '13px', fontWeight: '800', letterSpacing: '.22em', color: '#a79c8e', marginBottom: '22px' }}>마인드포스팃</div>
            <h1 style={{ fontSize: 'clamp(34px, 7vw, 64px)', lineHeight: '1.18', letterSpacing: '-.06em', fontWeight: '900', marginBottom: '28px' }}>어떤 이야기든,<br />여기선 괜찮아요.</h1>
            <div style={{ width: '1px', height: '34px', background: '#c8beb2', margin: '0 auto 28px' }} />
            <p style={{ fontSize: '20px', lineHeight: '1.9', color: '#6c655d' }}>충분히 들어줄게요.</p>

            <div style={{ display: 'flex', justifyContent: 'center', gap: '12px', flexWrap: 'wrap', margin: '28px 0 24px' }}>
              <button onClick={goWrite} style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', padding: '18px 30px', borderRadius: '999px', fontSize: '16px', fontWeight: '800', background: '#23231f', color: '#f8f5ef', border: 'none', cursor: 'pointer', fontFamily: "'Noto Sans KR', sans-serif", boxShadow: '0 14px 28px rgba(35,35,31,.18)' }}>지금 남기기</button>
              <button onClick={goLogin} style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', padding: '18px 30px', borderRadius: '999px', fontSize: '16px', fontWeight: '800', background: 'transparent', color: '#5e5850', border: '1px solid #d9d0c3', cursor: 'pointer', fontFamily: "'Noto Sans KR', sans-serif" }}>로그인 · 나만의 공간</button>
              <button onClick={() => scrollTo(flowRef)} style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', padding: '18px 30px', borderRadius: '999px', fontSize: '16px', fontWeight: '800', background: 'transparent', color: '#5e5850', border: '1px solid #d9d0c3', cursor: 'pointer', fontFamily: "'Noto Sans KR', sans-serif" }}>먼저 둘러보기</button>
            </div>

            <div style={{ display: 'flex', justifyContent: 'center', gap: '10px', flexWrap: 'wrap', marginBottom: '22px' }}>
              {['익명 가능', 'AI 아님', '아침 답장'].map(t => (
                <span key={t} style={{ padding: '10px 16px', borderRadius: '999px', border: '1px solid #d9d0c3', background: '#fbf7f1', color: '#746d65', fontSize: '14px' }}>{t}</span>
              ))}
            </div>
            <p style={{ fontSize: '16px', color: '#978f84' }}>익명으로 시작해도 괜찮아요.</p>
          </div>
        </section>

        {/* 소개 */}
        <section style={{ padding: '88px 24px' }}>
          <div style={{ maxWidth: '1180px', margin: '0 auto' }}>
            <div style={{ fontSize: '15px', fontWeight: '800', letterSpacing: '.18em', color: '#a29789', marginBottom: '12px' }}>소개</div>
            <h2 style={{ fontSize: 'clamp(24px, 4vw, 38px)', lineHeight: '1.28', letterSpacing: '-.04em', fontWeight: '900', marginBottom: '12px' }}>마인드포스팃은 익명 게시판이 아니라,<br />조용히 받아주는 1:1 개인 공간이에요.</h2>
            <p style={{ maxWidth: '760px', fontSize: '17px', lineHeight: '1.9', color: '#6c655d', marginBottom: '34px' }}>잘 쓴 문장이 아니어도 괜찮아요. 정리되지 않은 마음이어도 괜찮아요. 밤에 남겨둔 이야기를 아침에 직접 읽고, 짧지만 담백하게 답장을 남겨요. 로그인하면 내 이야기와 공간이 생겨요.</p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '18px' }}>
              {[
                { k: '무엇을 해주나요', v: '어떤 이야기든\n편향과 선입견 없이 들어요.', sub: '평가보다 먼저 수신하고, 조언보다 먼저 받아줍니다.' },
                { k: '왜 믿을 수 있나요', v: 'AI 자동 응답이 아니라,\n진짜 사람이 직접 읽어요.', sub: '기계적인 문장이 아니라, 실제로 읽은 흔적이 느껴지는 답장을 보냅니다.' },
                { k: '왜 다시 오게 되나요', v: '밤에 남기고,\n아침 6–7시에 확인해요.', sub: '푸시 대신 약속된 시간과 기다림이 재방문 이유가 됩니다.' },
              ].map(({ k, v, sub }) => (
                <div key={k} style={{ background: 'rgba(255,255,255,.55)', border: '1px solid rgba(217,208,195,.95)', borderRadius: '26px', padding: '24px', boxShadow: '0 14px 34px rgba(38,37,34,.04)' }}>
                  <div style={{ fontSize: '12px', letterSpacing: '.14em', color: '#9c9183', marginBottom: '8px' }}>{k}</div>
                  <div style={{ fontSize: '20px', fontWeight: '800', lineHeight: '1.5', marginBottom: '10px', whiteSpace: 'pre-line' }}>{v}</div>
                  <div style={{ fontSize: '15px', lineHeight: '1.8', color: '#6f685f' }}>{sub}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* 이용 흐름 */}
        <section ref={flowRef} style={{ padding: '88px 24px' }}>
          <div style={{ maxWidth: '1180px', margin: '0 auto' }}>
            <div style={{ fontSize: '15px', fontWeight: '800', letterSpacing: '.18em', color: '#a29789', marginBottom: '12px' }}>이용 흐름</div>
            <h2 style={{ fontSize: 'clamp(24px, 4vw, 38px)', lineHeight: '1.28', letterSpacing: '-.04em', fontWeight: '900', marginBottom: '12px' }}>복잡하지 않게, 네 단계면 충분해요.</h2>
            <p style={{ maxWidth: '760px', fontSize: '17px', lineHeight: '1.9', color: '#6c655d', marginBottom: '34px' }}>한 번 들어오면 무엇을 해야 하는지 바로 이해되고, 다시 들어오면 내 이야기 상태가 먼저 보이도록 설계했어요.</p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px' }}>
              {[
                { num: 'STEP 01', title: '익명으로 남기기', desc: '이름 없이 바로 시작할 수 있어요. 잘 정리되지 않아도 괜찮아요.', time: '22:43', cardTitle: '말 못한 게 있죠.', cardSub: '잘 정리되지 않아도, 지금 마음 그대로 남겨도 돼요.', cardText: '퇴근하고 누웠는데 머리가 멈추질 않아요...', btn: '남기기' },
                { num: 'STEP 02', title: '아침 답장 기다리기', desc: '남긴 이야기는 끝난 게 아니라, 아침에 다시 확인할 이유로 남아 있어요.', time: '22:47', cardTitle: '남겨줘서 고마워요.', cardSub: '오늘 밤 남긴 이야기는 아침 6–7시에 차분히 읽고 답장을 남겨둘게요.', cardText: '아침 06–07시 답장', btn: '답장 받으러 오기' },
                { num: 'STEP 03', title: '내 공간에서 확인하기', desc: '다시 들어오면 홈이 아니라, 가장 최근에 남긴 이야기의 상태가 먼저 보여요.', time: '08:12', cardTitle: '답장이 도착했어요.', cardSub: '어젯밤 이야기를 읽고 답장을 남겼어요.', cardText: '하루가 끝났는데도 머리가 계속 달리고 있었던 것 같아요...', btn: '이어서 말하기' },
                { num: 'STEP 04', title: '조용히 이어가기', desc: '내 이야기와 답장이 스레드로 쌓이며, 1:1 개인 공간이 만들어져요.', time: '08:16', cardTitle: '내 이야기 스레드', cardSub: '한두 문장으로 이어서 남겨도 충분해요.', cardText: '오늘 출근길도 벌써 막막해요.', btn: '남기기' },
              ].map(({ num, title, desc, time, cardTitle, cardSub, cardText, btn }) => (
                <div key={num} style={{ background: 'linear-gradient(180deg,#fffdfa,#f7efe4)', border: '1px solid #d9d0c3', borderRadius: '28px', padding: '24px', boxShadow: '0 16px 34px rgba(38,37,34,.05)' }}>
                  <div style={{ fontSize: '12px', fontWeight: '900', letterSpacing: '.18em', color: '#a39789', marginBottom: '12px' }}>{num}</div>
                  <div style={{ fontSize: '22px', fontWeight: '900', letterSpacing: '-.03em', marginBottom: '10px' }}>{title}</div>
                  <div style={{ fontSize: '15px', lineHeight: '1.8', color: '#6c655d', marginBottom: '12px' }}>{desc}</div>
                  <div style={{ height: '280px', background: '#f3ede4', border: '7px solid #262522', borderRadius: '28px', padding: '12px', overflow: 'hidden', boxShadow: '0 18px 32px rgba(38,37,34,.10)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '9px', fontWeight: '800', color: '#6a6258', marginBottom: '8px' }}><span>{time}</span><span>LTE</span></div>
                    <div style={{ background: '#fffdfa', border: '1px solid #d9d0c3', borderRadius: '16px', padding: '16px', boxShadow: '0 4px 10px rgba(38,37,34,.04)' }}>
                      <div style={{ fontSize: '15px', fontWeight: '800', marginBottom: '6px' }}>{cardTitle}</div>
                      <div style={{ fontSize: '12px', lineHeight: '1.7', color: '#7a7268', marginBottom: '10px' }}>{cardSub}</div>
                      <div style={{ background: '#f8f2e8', border: '1px solid #d9d0c3', borderRadius: '12px', padding: '12px', fontSize: '12px', lineHeight: '1.8', color: '#4d4943', minHeight: '74px' }}>{cardText}</div>
                      <div style={{ marginTop: '10px', width: '100%', padding: '12px', border: 'none', borderRadius: '12px', background: '#23231f', color: '#f8f5ef', fontSize: '12px', fontWeight: '800', textAlign: 'center' }}>{btn}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* 미리보기 */}
        <section style={{ padding: '88px 24px' }}>
          <div style={{ maxWidth: '1180px', margin: '0 auto' }}>
            <div style={{ fontSize: '15px', fontWeight: '800', letterSpacing: '.18em', color: '#a29789', marginBottom: '12px' }}>미리보기</div>
            <h2 style={{ fontSize: 'clamp(24px, 4vw, 38px)', lineHeight: '1.28', letterSpacing: '-.04em', fontWeight: '900', marginBottom: '34px' }}>실제 사용자는 이런 느낌으로 만나요.</h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '22px', alignItems: 'start' }}>
              <div style={{ background: 'rgba(255,255,255,.58)', border: '1px solid rgba(217,208,195,.95)', borderRadius: '28px', padding: '24px', boxShadow: '0 14px 34px rgba(38,37,34,.04)' }}>
                <div style={{ fontSize: '24px', fontWeight: '900', letterSpacing: '-.03em', marginBottom: '10px' }}>내가 남긴 이야기</div>
                <p style={{ fontSize: '16px', lineHeight: '1.9', color: '#6c655d', marginBottom: '16px' }}>처음엔 그냥 남기는 행위가 중심이고, 다시 들어오면 "내 이야기, 읽혔나?"에 대한 답이 가장 먼저 보여야 해요.</p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  <div style={{ marginLeft: 'auto', maxWidth: '86%', padding: '14px 16px', borderRadius: '18px', fontSize: '15px', lineHeight: '1.8', background: '#fffdfa', border: '1px solid #d9d0c3', color: '#302d2a', boxShadow: '0 4px 10px rgba(38,37,34,.04)' }}>퇴근하고 누웠는데 머리가 멈추질 않아요. 별일 아닌데 자꾸 커져요.</div>
                  <div style={{ maxWidth: '86%', padding: '14px 16px', borderRadius: '18px', fontSize: '15px', lineHeight: '1.8', background: '#262522', color: '#f8f4ed', boxShadow: '0 4px 10px rgba(38,37,34,.04)' }}>하루가 끝났는데도 머리가 계속 달리고 있었던 것 같아요. 여기까지 적어준 것만으로도 조금은 덜 혼자였으면 좋겠어요.</div>
                  <div style={{ marginLeft: 'auto', maxWidth: '86%', padding: '14px 16px', borderRadius: '18px', fontSize: '15px', lineHeight: '1.8', background: '#fffdfa', border: '1px solid #d9d0c3', color: '#302d2a', boxShadow: '0 4px 10px rgba(38,37,34,.04)' }}>고마워요. 오늘 출근길도 벌써 막막해요.</div>
                </div>
                <div style={{ fontSize: '12px', color: '#a09689', marginTop: '6px' }}>짧지만 실제로 읽고 남긴 답장처럼 보여야 신뢰가 생겨요.</div>
              </div>
              <div style={{ background: 'rgba(255,255,255,.58)', border: '1px solid rgba(217,208,195,.95)', borderRadius: '28px', padding: '24px', boxShadow: '0 14px 34px rgba(38,37,34,.04)' }}>
                <div style={{ fontSize: '24px', fontWeight: '900', letterSpacing: '-.03em', marginBottom: '10px' }}>이 공간이 달라지는 지점</div>
                <p style={{ fontSize: '16px', lineHeight: '1.9', color: '#6c655d', marginBottom: '16px' }}>익명으로 시작하지만, 공개 피드로 흘러가지 않아요. 내 이야기와 답장이 내 공간에 쌓이기 때문에 게시판이 아니라 개인 공간처럼 느껴져요.</p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {[
                    { title: '익명으로 시작', desc: '로그인 전에도 바로 남길 수 있어요.' },
                    { title: '아침에 답장', desc: '푸시 대신 약속된 시간으로 재방문을 만들어요.' },
                    { title: '내 공간에 보관', desc: '로그인하면 내 이야기와 답장이 계속 이어져요.' },
                  ].map(({ title, desc }) => (
                    <div key={title} style={{ background: '#fbf6ef', border: '1px solid #d9d0c3', borderRadius: '20px', padding: '18px 20px' }}>
                      <div style={{ fontSize: '16px', fontWeight: '800', marginBottom: '6px' }}>{title}</div>
                      <div style={{ fontSize: '14px', lineHeight: '1.8', color: '#6c655d' }}>{desc}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* 안내 */}
        <section style={{ padding: '88px 24px' }}>
          <div style={{ maxWidth: '1180px', margin: '0 auto' }}>
            <div style={{ fontSize: '15px', fontWeight: '800', letterSpacing: '.18em', color: '#a29789', marginBottom: '12px' }}>안내</div>
            <h2 style={{ fontSize: 'clamp(24px, 4vw, 38px)', lineHeight: '1.28', letterSpacing: '-.04em', fontWeight: '900', marginBottom: '12px' }}>가볍지만, 분명한 약속이 있어요.</h2>
            <p style={{ maxWidth: '760px', fontSize: '17px', lineHeight: '1.9', color: '#6c655d', marginBottom: '28px' }}>서비스의 톤이 조용하고 부드러워도, 사용자가 알아야 할 기준은 명확해야 해요.</p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '14px' }}>
              {[
                { title: '익명 글은 24시간 뒤 사라져요', desc: '로그인하지 않은 상태에서 남긴 글은 하루 뒤 삭제돼요. 로그인하면 내 이야기와 답장이 내 공간에 남아요.' },
                { title: '답장은 아침 6시–7시 사이에 남겨요', desc: '즉답이 아니라, 차분히 읽고 남기는 답장이에요. 이 약속된 시간이 다시 돌아올 이유가 돼요.' },
                { title: 'AI 자동 응답이 아니에요', desc: '진짜 사람이 직접 읽고 답장을 남겨요. 그래서 속도보다 읽은 흔적과 톤의 일관성이 더 중요해요.' },
                { title: '의료·상담 서비스는 아니에요', desc: '누군가의 이야기를 받아주고 짧게 돌려주는 개인 공간이에요. 위기 신호가 느껴질 때는 별도의 도움을 우선 권해요.' },
              ].map(({ title, desc }) => (
                <div key={title} style={{ background: '#fbf6ef', border: '1px solid #d9d0c3', borderRadius: '20px', padding: '18px 20px' }}>
                  <div style={{ fontSize: '16px', fontWeight: '800', marginBottom: '6px' }}>{title}</div>
                  <div style={{ fontSize: '14px', lineHeight: '1.8', color: '#6c655d' }}>{desc}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* 클로징 */}
        <section style={{ padding: '96px 24px 112px' }}>
          <div style={{ maxWidth: '980px', margin: '0 auto', background: 'linear-gradient(180deg,#fffdfa,#f7efe4)', border: '1px solid #d9d0c3', borderRadius: '36px', padding: '42px 32px', textAlign: 'center', boxShadow: '0 28px 80px rgba(38,37,34,.10)' }}>
            <h2 style={{ fontSize: 'clamp(28px, 5vw, 40px)', lineHeight: '1.3', letterSpacing: '-.05em', fontWeight: '900', marginBottom: '12px' }}>어떤 이야기든,<br />여기선 괜찮아요.</h2>
            <p style={{ fontSize: '18px', lineHeight: '1.9', color: '#6c655d', maxWidth: '720px', margin: '0 auto 24px' }}>말하기 어려운 이야기일수록, 조용히 둘 곳이 필요하니까. 오늘 마음 한 장을 마인드포스팃에 남겨보세요.</p>
            <div style={{ display: 'flex', justifyContent: 'center', gap: '12px', flexWrap: 'wrap' }}>
              <button onClick={goWrite} style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', padding: '18px 30px', borderRadius: '999px', fontSize: '16px', fontWeight: '800', background: '#23231f', color: '#f8f5ef', border: 'none', cursor: 'pointer', fontFamily: "'Noto Sans KR', sans-serif", boxShadow: '0 14px 28px rgba(35,35,31,.18)' }}>지금 남기기</button>
              <button onClick={() => scrollTo(introRef)} style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', padding: '18px 30px', borderRadius: '999px', fontSize: '16px', fontWeight: '800', background: 'transparent', color: '#5e5850', border: '1px solid #d9d0c3', cursor: 'pointer', fontFamily: "'Noto Sans KR', sans-serif" }}>처음으로</button>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
