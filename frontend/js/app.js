document.addEventListener("DOMContentLoaded", () => {
    // DOM 요소 캐싱
    const inputText = document.getElementById("inputText");
    const charCounter = document.getElementById("charCounter");
    const audienceBtns = document.querySelectorAll(".audience-btn");
    const convertBtn = document.getElementById("convertBtn");
    const resultPlaceholder = document.getElementById("resultPlaceholder");
    const outputText = document.getElementById("outputText");
    const copyBtn = document.getElementById("copyBtn");
    const copyBtnText = document.getElementById("copyBtnText");

    // 기본 설정
    // static 마운트로 인해 프론트와 백엔드가 동일 도메인을 공유하므로 window.location.origin 사용
    // 로컬 개발 환경(포트 미동작 등) 고려하여 백업 호스트 지정
    const API_BASE = window.location.origin;

    let selectedAudience = "boss"; // 기본값: 상사/임원
    let isTyping = false; // 타이핑 애니메이션 실행 여부

    // 1. 수신 대상 버튼 토글 및 ARIA 상태 변경
    audienceBtns.forEach(btn => {
        btn.addEventListener("click", () => {
            // 모든 버튼 비활성화
            audienceBtns.forEach(b => {
                b.classList.remove("active");
                b.setAttribute("aria-checked", "false");
            });

            // 선택된 버튼 활성화
            btn.classList.add("active");
            btn.setAttribute("aria-checked", "true");
            selectedAudience = btn.dataset.target;
        });
    });

    // 2. 글자 수 세기 기능
    inputText.addEventListener("input", () => {
        const len = inputText.value.length;
        charCounter.textContent = `${len}/1000자`;
    });

    // 3. 타이핑 효과 함수 (결과 텍스트 유려하게 출력)
    function typeWriter(text, index = 0) {
        if (index < text.length) {
            isTyping = true;
            outputText.value += text[index];
            
            // 스크롤을 항상 하단으로 유지
            outputText.scrollTop = outputText.scrollHeight;

            // 타이핑 속도 (15ms 간격)
            setTimeout(() => typeWriter(text, index + 1), 15);
        } else {
            isTyping = false;
            // 복사 버튼 활성화
            copyBtn.classList.remove("disabled");
            copyBtn.removeAttribute("disabled");
        }
    }

    // 4. 말투 변환 API 호출 함수
    async function convertTone() {
        const textValue = inputText.value.trim();

        if (!textValue) {
            alert("변환할 원문 내용을 입력해 주세요.");
            inputText.focus();
            return;
        }

        if (isTyping) return; // 타이핑 진행 중 중복 요청 방지

        // UI 로딩 상태 시작
        convertBtn.classList.add("loading");
        convertBtn.disabled = true;
        copyBtn.classList.add("disabled");
        copyBtn.disabled = true;

        try {
            const response = await fetch(`${API_BASE}/api/convert`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    text: textValue,
                    target_audience: selectedAudience
                })
            });

            if (!response.ok) {
                const errData = await response.json();
                throw new Error(errData.detail || "서버 응답 오류");
            }

            const data = await response.json();
            
            // 결과 창 영역 전환 (Placeholder 숨기고 textarea 보이기)
            resultPlaceholder.classList.add("hidden");
            outputText.classList.remove("hidden");

            // 결과값 갱신 및 타이핑 애니메이션 실행
            outputText.value = "";
            typeWriter(data.converted_text);

        } catch (error) {
            console.error("변환 중 에러 발생:", error);
            alert(`말투 변환 실패: ${error.message || "서버와 통신할 수 없습니다. 잠시 후 다시 시도해 주세요."}`);
            
            // 오류 시 placeholder 복원
            resultPlaceholder.classList.remove("hidden");
            outputText.classList.add("hidden");
        } finally {
            // UI 로딩 상태 복원
            convertBtn.classList.remove("loading");
            convertBtn.disabled = false;
        }
    }

    convertBtn.addEventListener("click", convertTone);

    // 5. 클립보드 복사 기능 및 마이크로 피드백 모션
    copyBtn.addEventListener("click", async () => {
        const outputValue = outputText.value.trim();
        if (!outputValue || copyBtn.classList.contains("disabled")) return;

        try {
            await navigator.clipboard.writeText(outputValue);
            
            // 복사 성공 마이크로 인터랙션 피드백
            copyBtnText.textContent = "복사 완료!";
            copyBtn.classList.add("success");

            // 2초 후 원래대로 복구
            setTimeout(() => {
                copyBtnText.textContent = "클립보드 복사하기";
                copyBtn.classList.remove("success");
            }, 2000);

        } catch (err) {
            console.error("클립보드 복사 실패:", err);
            alert("복사 기능이 지원되지 않는 환경이거나 실패했습니다. 직접 복사해 주세요.");
        }
    });
});
