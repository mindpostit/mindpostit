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
  console.log('🗣️ 3턴 대화 시작...', { 
    userMessage, 
    historyLength: conversationHistory.length,
    turn: Math.floor(conversationHistory.length / 2) + 1 
  });
  
  // 테스트 기간 체크
  if (!isTestActive()) {
    return {
      success: false,
      error: 'TEST_ENDED',
      message: '테스트 기간이 종료되었습니다'
    };
  }
  
  try {
    // 현재 턴 계산 (user + assistant = 1턴)
    const currentTurn = Math.floor(conversationHistory.length / 2) + 1;
    
    console.log('📍 현재 턴:', currentTurn, '히스토리:', conversationHistory);
    
    // 3턴 초과 방지
    if (currentTurn > 3) {
      console.log('❌ 3턴 초과!');
      return {
        success: false,
        error: 'MAX_TURNS_REACHED',
        message: '대화가 종료되었습니다',
        isLastTurn: true
      };
    }
    
    // 백엔드 API 호출
    const response = await fetch('/api/conversation', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        userMessage,
        conversationHistory,
        currentTurn
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('API 오류:', errorText);
      throw new Error('API 호출 실패');
    }

    const data = await response.json();
    
    console.log('✅ AI 응답:', data);
    
    return data;
    
  } catch (error) {
    console.error('❌ 3턴 대화 오류:', error);
    
    // 폴백 응답
    const currentTurn = Math.floor(conversationHistory.length / 2) + 1;
    const fallbackMessages = [
      "많이 힘들었구나. 무슨 일이야?",
      "그랬구나... 어떤 느낌이었어?",
      "많이 힘들었겠다. 천천히 괜찮아질 거야."
    ];
    
    return {
      success: true,
      message: fallbackMessages[Math.min(currentTurn - 1, 2)],
      turn: currentTurn,
      isLastTurn: currentTurn >= 3,
      isFallback: true
    };
  }
};

export default { generateDeepConversation, isTestActive };