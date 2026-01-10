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
    
    // 간단 명확한 프롬프트
    let systemPrompt = '';
    
    if (currentTurn === 1) {
      systemPrompt = `너는 친구야. 반말로 짧게 공감해줘.
"많이 힘들었구나. 무슨 일이야?" 이런 식으로.
2-3문장으로 짧게. 부드럽게 물어봐.`;
    } else if (currentTurn === 2) {
      systemPrompt = `너는 친구야. 반말로 짧게 공감해줘.
한 번만 더 물어봐. 2-3문장으로 짧게.`;
    } else {
      systemPrompt = `너는 친구야. 반말로 짧게 공감하고 마무리해줘.
질문하지 말고 위로로 끝내. 2-3문장으로 짧게.`;
    }
    
    // API 메시지 구성
    const messages = [];
    
    // 대화 히스토리를 messages 배열로 구성
    conversationHistory.forEach(msg => {
      messages.push({
        role: msg.role,
        content: msg.content
      });
    });
    
    // 현재 사용자 메시지 추가
    messages.push({
      role: 'user',
      content: userMessage
    });
    
    console.log('📤 전송할 메시지:', messages);
    
    // Claude API 호출
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": process.env.REACT_APP_ANTHROPIC_API_KEY || "",
        "anthropic-version": "2023-06-01"
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-20250514",
        max_tokens: 300,
        system: systemPrompt,
        messages: messages
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('API 오류:', errorText);
      throw new Error('API 호출 실패');
    }

    const data = await response.json();
    const aiMessage = data.content[0].text.trim();
    
    console.log('✅ AI 응답:', { turn: currentTurn, message: aiMessage });
    
    return {
      success: true,
      message: aiMessage,
      turn: currentTurn,
      isLastTurn: currentTurn >= 3
    };
    
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