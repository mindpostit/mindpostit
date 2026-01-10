// 3턴 고도화 대화 AI 서비스

// 테스트 종료 날짜
const TEST_END_DATE = new Date('2026-01-15 23:59:59');

// 테스트 기간 확인
export const isTestActive = () => {
  const now = new Date();
  return now <= TEST_END_DATE;
};

// 3턴 대화 생성
export const generateDeepConversation = async (userMessage, conversationHistory = []) => {
  console.log('🗣️ 3턴 대화 시작...', { userMessage, turn: conversationHistory.length + 1 });
  
  // 테스트 기간 체크
  if (!isTestActive()) {
    return {
      success: false,
      error: 'TEST_ENDED',
      message: '테스트 기간이 종료되었습니다 (1/15까지)'
    };
  }
  
  try {
    // 현재 턴 계산
    const currentTurn = conversationHistory.length + 1;
    
    // 3턴 초과 방지
    if (currentTurn > 3) {
      return {
        success: false,
        error: 'MAX_TURNS_REACHED',
        message: '대화가 종료되었습니다'
      };
    }
    
    // 대화 히스토리 구성
    const messages = [
      {
        role: "user",
        content: `당신은 친구처럼 공감하는 AI입니다.
사용자가 힘든 마음을 털어놨습니다.

중요한 규칙:
1. 반말로 친구처럼 자연스럽게 (존댓말 X)
2. 짧게 2-3문장으로
3. 공감 먼저, 질문은 부드럽게
4. 조언하지 말고 그냥 들어주기
5. 판단하지 말기
6. 진짜 친구처럼 따뜻하게

${currentTurn === 1 ? 
  `첫 응답:
- 공감하고 위로하기
- 더 말하고 싶으면 할 수 있게 부드럽게 물어보기
- "무슨 일 있었어?", "어떤 느낌이었어?" 같은 자연스러운 질문` :
  currentTurn === 2 ?
  `두 번째 응답:
- 사용자가 더 말해준 내용에 깊이 공감하기
- 한 번만 더 부드럽게 물어보기
- "그래서 어떻게 됐어?", "지금은 어때?" 같은 질문` :
  `마지막 응답:
- 충분히 공감하고 위로하기
- 질문 없이 마무리
- "천천히 괜찮아질 거야", "힘내" 같은 따뜻한 마무리`
}

사용자가 한 말: "${userMessage}"

친구처럼 자연스럽게, 짧게 2-3문장으로 답해줘.`
      }
    ];
    
    // 대화 히스토리 추가
    conversationHistory.forEach(msg => {
      messages.push({
        role: msg.role === 'user' ? 'user' : 'assistant',
        content: msg.content
      });
    });
    
    // 현재 사용자 메시지 추가 (첫 턴이 아닐 때)
    if (currentTurn > 1) {
      messages.push({
        role: 'user',
        content: userMessage
      });
    }
    
    // Claude API 호출
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-20250514",
        max_tokens: 500,
        messages: messages
      })
    });

    if (!response.ok) {
      throw new Error('API 호출 실패');
    }

    const data = await response.json();
    const aiMessage = data.content[0].text;
    
    console.log('✅ AI 응답 생성 완료:', { turn: currentTurn, message: aiMessage });
    
    return {
      success: true,
      message: aiMessage,
      turn: currentTurn,
      isLastTurn: currentTurn >= 3
    };
    
  } catch (error) {
    console.error('❌ 3턴 대화 오류:', error);
    
    // 폴백 응답
    const fallbackMessages = [
      "많이 힘들었구나. 무슨 일 있었어? 말하고 싶으면 더 얘기해봐.",
      "그랬구나... 많이 힘들었겠다. 어떤 느낌이었어?",
      "진짜 힘들었겠다. 천천히 괜찮아질 거야. 힘내."
    ];
    
    const currentTurn = conversationHistory.length + 1;
    
    return {
      success: true,
      message: fallbackMessages[Math.min(currentTurn - 1, 2)],
      turn: currentTurn,
      isLastTurn: currentTurn >= 3,
      isFallback: true
    };
  }
};

// 대화 상태 초기화
export const initConversation = (postContent) => {
  return {
    postId: null,
    history: [
      {
        role: 'user',
        content: postContent
      }
    ],
    currentTurn: 0
  };
};

export default { generateDeepConversation, isTestActive, initConversation };