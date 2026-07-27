import os
from fastapi import HTTPException
from langchain_core.prompts import ChatPromptTemplate
from langchain_upstage import ChatUpstage
from dotenv import load_dotenv
from backend.prompts.templates import PROMPTS

# .env 로드
load_dotenv(override=True)

class ToneConverter:
    def __init__(self):
        # 환경변수 검증
        api_key = os.getenv("UPSTAGE_API_KEY")
        if not api_key:
            raise ValueError("UPSTAGE_API_KEY 환경변수가 설정되지 않았습니다.")
        
        # Upstage ChatUpstage 객체 생성
        self.llm = ChatUpstage(model="solar-pro", temperature=0.7)

    async def convert(self, text: str, target_audience: str) -> str:
        """
        입력 텍스트와 수신 대상에 맞춰 말투를 변환합니다.
        """
        # 수신 대상 유효성 검증
        if target_audience not in PROMPTS:
            raise HTTPException(
                status_code=400,
                detail=f"지원하지 않는 수신 대상입니다. 허용값: {list(PROMPTS.keys())}"
            )

        try:
            # 템플릿 문자열 가져오기
            template_str = PROMPTS[target_audience]
            
            # ChatPromptTemplate 생성
            prompt = ChatPromptTemplate.from_template(template_str)
            
            # Chain 구성 및 실행
            # 템플릿에 text를 인수로 전달하여 결합한 뒤 LLM 호출
            chain = prompt | self.llm
            response = await chain.ainvoke({"text": text})
            
            # 결과 반환
            return response.content.strip()
        except Exception as e:
            # 예외 로깅 및 500 에러 처리
            print(f"Upstage API 호출 중 에러 발생: {str(e)}")
            raise HTTPException(
                status_code=500,
                detail="LLM API 호출 중 오류가 발생했습니다."
            )
