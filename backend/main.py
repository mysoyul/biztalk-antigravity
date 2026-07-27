import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from backend.routers import convert

app = FastAPI(
    title="업무 말투 변환기 API",
    description="일상 언어를 상황별 비즈니스 어조로 자동 변환해 주는 API 서버",
    version="1.0.0"
)

# CORS 설정
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # 배포 시 프로덕션 도메인으로 제한 가능
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 백엔드 API 라우터 등록
app.include_router(convert.router, prefix="/api")

# Health Check 엔드포인트
@app.get("/health", tags=["System"])
def health_check():
    return {"status": "ok"}

# 프론트엔드 정적 파일 서빙 등록 (API 라우터 뒤에 등록해야 가로채기가 발생하지 않음)
frontend_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "../frontend"))
if os.path.exists(frontend_dir):
    app.mount("/", StaticFiles(directory=frontend_dir, html=True), name="static")
else:
    print(f"경고: 프론트엔드 정적 디렉토리를 찾을 수 없습니다: {frontend_dir}")
