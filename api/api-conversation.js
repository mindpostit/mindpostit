// Vercel Serverless Function
// 파일 위치: /api/conversation.js

export default async function handler(req, res) {
  // CORS 설정
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  
  try {
    const { userMessage, conversationHistory = [], currentTurn = 1 } = req.body;
    
    console.log('📥 요청:', { userMessage, turn: currentTurn, historyLength: conversationHistory.length });
    
    // 프롬프트 설정
    let systemPrompt = '';
    
    if (currentTurn === 1) {
      systemPrompt = `너는 친구야. 반말로 짧게 공감해줘.
사용자의 감정과 상황을 먼저 파악하고 그에 맞게 반응해.
2-3문장으로 짧게. 부드럽게 물어봐.`;
    } else if (currentTurn === 2) {
      systemPrompt = `너는 친구야. 반말로 짧게 공감해줘.
한 번만 더 물어봐. 2-3문장으로 짧게.`;
    } else {
      systemPrompt = `너는 친구야. 반말로 짧게 공감하고 마무리해줘.
질문하지 말고 위로로 끝내. 2-3문장으로 짧게.`;
    }
    
    // 메시지 구성
    const messages = [];
    
    conversationHistory.forEach(msg => {
      messages.push({
        role: msg.role,
        content: msg.content
      });
    });
    
    messages.push({
      role: 'user',
      content: userMessage
    });
    
    console.log('📤 Anthropic API 호출...');
    
    // Anthropic API 호출
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": process.env.ANTHROPIC_API_KEY,
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
      console.error('❌ Anthropic API 오류:', errorText);
      throw new Error('API 호출 실패');
    }
    
    const data = await response.json();
    const aiMessage = data.content[0].text.trim();
    
    console.log('✅ 응답 성공:', aiMessage.substring(0, 50) + '...');
    
    return res.status(200).json({
      success: true,
      message: aiMessage,
      turn: currentTurn,
      isLastTurn: currentTurn >= 3
    });
    
  } catch (error) {
    console.error('❌ 서버 오류:', error);
    
    // 폴백 응답
    const currentTurn = req.body?.currentTurn || 1;
    const fallbackMessages = [
      "많이 힘들었구나. 무슨 일이야?",
      "그랬구나... 어떤 느낌이었어?",
      "많이 힘들었겠다. 천천히 괜찮아질 거야."
    ];
    
    return res.status(200).json({
      success: true,
      message: fallbackMessages[Math.min(currentTurn - 1, 2)],
      turn: currentTurn,
      isLastTurn: currentTurn >= 3,
      isFallback: true
    });
  }
}