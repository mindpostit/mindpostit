import tarotCards from './tarot-cards';

// Claude API를 통한 AI 타로 리딩
export const generateTarotReading = async (userPost) => {
  console.log('🔮 AI 타로 생성 중...', userPost);
  
  try {
    // Claude API 호출
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-20250514",
        max_tokens: 1000,
        messages: [
          {
            role: "user",
            content: `당신은 공감 능력이 뛰어난 타로 리더입니다. 
사용자의 감정을 깊이 이해하고, 타로 카드로 위로와 공감을 전달합니다.

사용자가 쓴 글:
"${userPost}"

위 글을 읽고 다음을 수행하세요:
1. 사용자의 감정 상태 파악 (화남, 슬픔, 불안, 고민 등)
2. 과거-현재-미래 맥락에 맞는 타로 카드 3장 선택
3. 각 카드를 사용자의 상황에 맞게 공감하며 해석

**중요:**
- 조언이나 해결책보다는 "그냥 들어주고 공감"하는 톤
- "~해야 해요" 같은 조언 금지
- "~였구나", "~겠네" 같은 공감 표현 사용
- 각 카드 해석은 2-3문장으로 짧게

다음 JSON 형식으로만 답변:
{
  "past": {
    "card": "카드 이름 (한글)",
    "interpretation": "과거 해석 (공감하는 톤, 2-3문장)"
  },
  "present": {
    "card": "카드 이름 (한글)",
    "interpretation": "현재 해석 (공감하는 톤, 2-3문장)"
  },
  "future": {
    "card": "카드 이름 (한글)",
    "interpretation": "미래 해석 (공감하는 톤, 2-3문장)"
  }
}

사용 가능한 카드 목록:
${tarotCards.map(c => `${c.korean}(${c.name}): ${c.keywords.join(', ')}`).join('\n')}
`
          }
        ]
      })
    });

    if (!response.ok) {
      throw new Error('API 호출 실패');
    }

    const data = await response.json();
    const content = data.content[0].text;
    
    // JSON 파싱
    const cleanContent = content.replace(/```json\n?|\n?```/g, '').trim();
    const reading = JSON.parse(cleanContent);
    
    console.log('✅ AI 타로 생성 완료:', reading);
    
    return {
      success: true,
      reading: reading
    };
    
  } catch (error) {
    console.error('❌ AI 타로 생성 오류:', error);
    
    // 폴백: 간단한 공감 메시지
    return {
      success: true,
      reading: {
        past: {
          card: "힘 (Strength)",
          interpretation: "지금까지 참고 견뎌왔구나. 쉽지 않았을 텐데 정말 고생 많았어."
        },
        present: {
          card: "검 5 (Five of Swords)",
          interpretation: "지금 마음이 복잡하고 힘든 상황이네. 그 감정 충분히 이해해."
        },
        future: {
          card: "별 (The Star)",
          interpretation: "조금씩 나아질 거야. 지금은 힘들어도 천천히 괜찮아질 거야."
        }
      }
    };
  }
};

// 타로 리딩을 댓글 형식으로 변환
export const formatTarotAsComment = (reading) => {
  return `🔮 타로로 네 마음을 봤어

**과거 - ${reading.past.card}**
${reading.past.interpretation}

**현재 - ${reading.present.card}**
${reading.present.interpretation}

**미래 - ${reading.future.card}**
${reading.future.interpretation}

천천히, 네 속도대로 가면 돼.`;
};

export default { generateTarotReading, formatTarotAsComment };