import React from 'react';
import { X } from 'lucide-react';

const Terms = ({ onClose }) => {
  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[80vh] overflow-y-auto shadow-2xl">
        <div className="sticky top-0 bg-white border-b border-gray-200 p-6 flex justify-between items-center">
          <h2 className="text-2xl font-black text-gray-900">이용약관</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X size={24} />
          </button>
        </div>
        
        <div className="p-6 space-y-6">
          <section>
            <h3 className="text-lg font-bold text-gray-900 mb-3">1. 서비스 특징</h3>
            <ul className="space-y-2 text-gray-700 ml-4">
              <li>• 완전 익명으로 감정을 공유하는 공간입니다</li>
              <li>• 모든 글은 24시간 후 자정에 자동 삭제됩니다</li>
              <li>• <span className="font-bold text-amber-600">욕설은 OK, 나쁜 말은 NO</span></li>
            </ul>
          </section>

          <section>
            <h3 className="text-lg font-bold text-gray-900 mb-3">2. 금지 사항</h3>
            <p className="text-gray-700 mb-2">다음 내용은 자동 차단되거나 삭제됩니다:</p>
            <ul className="space-y-2 text-gray-700 ml-4">
              <li>• 성범죄, 폭력, 자해 관련 내용</li>
              <li>• 불법 약물, 무기 관련 내용</li>
              <li>• 개인정보 노출 (주민번호, 전화번호, 주소 등)</li>
              <li>• 타인을 향한 협박, 명예훼손</li>
            </ul>
          </section>

          <section>
            <h3 className="text-lg font-bold text-gray-900 mb-3">3. 게시 제한</h3>
            <p className="text-gray-700 ml-4">• 1분에 1개의 글만 작성할 수 있습니다</p>
          </section>

          <section>
            <h3 className="text-lg font-bold text-gray-900 mb-3">4. 문제 신고</h3>
            <p className="text-gray-700 ml-4">• 문제가 되는 글: <a href="mailto:report@mindpostit.live" className="text-amber-600 underline">report@mindpostit.live</a>로 제보</p>
          </section>

          <section>
            <h3 className="text-lg font-bold text-gray-900 mb-3">5. 운영자 권한</h3>
            <p className="text-gray-700 ml-4">• 규정 위반 게시물은 경고 없이 삭제될 수 있습니다</p>
          </section>

          <section>
            <h3 className="text-lg font-bold text-gray-900 mb-3">6. 면책</h3>
            <p className="text-gray-700 ml-4">• 사용자가 작성한 내용에 대한 책임은 작성자에게 있습니다</p>
          </section>
        </div>
      </div>
    </div>
  );
};

export default Terms;