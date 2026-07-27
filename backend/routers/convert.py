from fastapi import APIRouter, Depends, HTTPException
from backend.models.schemas import ConvertRequest, ConvertResponse
from backend.services.tone_converter import ToneConverter

router = APIRouter()

# ToneConverter 인스턴스 싱글톤처럼 의존성 주입 형태로 사용 가능
def get_tone_converter():
    try:
        return ToneConverter()
    except ValueError as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/convert", response_model=ConvertResponse)
async def convert_tone(
    request: ConvertRequest,
    converter: ToneConverter = Depends(get_tone_converter)
):
    """
    사용자가 입력한 원본 텍스트를 대상(audience)에 적합한 비즈니스 톤으로 변환합니다.
    """
    # 말투 변환 실행
    converted_text = await converter.convert(
        text=request.text,
        target_audience=request.target_audience
    )
    
    # 응답 포맷 구성
    return ConvertResponse(
        converted_text=converted_text,
        target_audience=request.target_audience,
        original_text=request.text
    )
