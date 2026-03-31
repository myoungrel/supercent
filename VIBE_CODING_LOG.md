# 바이브코딩 지시 내용

> 슈퍼센트 AI Application Engineer 과제 - 사용자 입력 자동 누적 로그

---

### [2026-03-31 - 세션 1]

지금 어떤 플로우까지 했는지 말해줘

---

### [2026-03-31 - 세션 1]

지금 내가 만들려는게 하이퍼캐주얼 게임 기획서를 내면 사람들이 불만을 가지는 요소들을 rag검색을 통해 자동으로 검색하고 알려주는 서비스를 만들려는거지?

---

### [2026-03-31 - 세션 1]

컨텍스트 엔지니어링, 스킬, 플러그인, 에이전트 등 내가 이용할 기술이 뭐가 있을까?

---

### [2026-03-31 - 세션 1]

과제 문서, 프로토타입 링크, 간단한 데모(영상 또는 GIF), 화면 설계(와이어프레임 또는 UI 설계), 바이브코딩 지시 내용(AI 응답 제외) 제출해야하는 내용에 이렇게 있는데 바이브코딩 지시 내용도 필요하잖아? 내가 질문한 내용들이랑 간단 답변들 계속 저장할수있나?

---

### [2026-03-31 - 세션 1]

옵션 A로 만들면 내가 입력할때마다 자동으로 저장돼?

---

### [2026-03-31 - 세션 1]

방법2로하면 많이 복잡함?

---

### [2026-03-31 - 세션 1]

설정해서 누적으로 저장되게 해줘

---

### [2026-03-31 09:34:33]

테스트용

---

### [2026-03-31 09:35:07]

재시작 해봐

---

### [2026-03-31 09:35:30]

지금 잘 되는거 같은데 이거 로그 대화 로그 저장할때 토큰사용함?

---

### [2026-03-31 09:53:24]

<ide_selection>The user selected the lines 15 to 15 from c:\IT\supercent_project\VIBE_CODING_LOG.md:
지금 내가 만들려는게 하이퍼캐주얼 게임 기획서를 내면 사람들이 불만을 가지는 요소들을 rag검색을 통해 자동으로 검색하고 알려주는 서비스를 만들려는거지

This may or may not be related to the current task.</ide_selection>
# 기획서

## 주제

이름 : Game Risk Patcher

설명 : 플레이스토어 저평점 리뷰를 RAG로 분석해, 하이퍼캐주얼 게임 기획 단계에서 예상 불만 요소를 사전 탐지하는 AI 리서치 도구

주제 카테고리 : 게임 아이디어 및 기획 정리

## 문제 정의

### 해결하려는 문제

하이퍼캐주얼 게임은 짧은 주기로 빠르게 기획·제작·테스트가 이루어지기 때문에, 기획 단계에서 유사 게임의 유저 불만 패턴을 충분히 검토하고 반영하기 어렵다.
특히 플레이스토어 리뷰에는 광고 피로, 조작 불편, 반복성, 난이도 급상승, 보상 부족 등 실제 유저가 이탈하는 이유가 많이 담겨 있지만, 이를 사람이 직접 수집하고 정리하기에는 시간과 비용이 많이 든다.

그 결과, 이미 시장에서 반복적으로 나타난 불만 요소가 다음 게임 기획안에 충분히 반영되지 못하고, 출시 이후 비슷한 문제가 다시 발생할 수 있다.

### 대상 사용자

- 하이퍼캐주얼 게임 기획자
- 게임 퍼블리싱 담당자
- 경쟁 게임 리서치 담당자
- 초기 프로토타입 검토를 진행하는 PM

### 현재 업무 방식

현재는 기획자나 퍼블리싱 담당자가 유사 게임을 직접 찾아 플레이해보거나, 플레이스토어/앱스토어 리뷰를 수동으로 읽으며 시장 반응을 파악하는 경우가 많다.

필요하면 별점이 낮은 리뷰를 일부 모아서 참고하지만, 대부분은 개인 경험이나 감각에 의존해 문제점을 정리하는 방식이다.

## 해결 방법

### 기획하는 AI 기능 설명

**RiskPatch**는 하이퍼캐주얼 게임 기획안을 입력하면,

플레이스토어 저평점 리뷰 데이터에서 유사한 불만 사례를 검색하고, 이를 바탕으로 **예상 유저 불만 요소와 기획 리스크를 사전에 알려주는 AI 리서치 도구**다.

이 서비스는 기획서 전체를 단순 비교하는 것이 아니라,

기획안에서 **장르, 조작 방식, 광고 구조, 보상 구조, 난이도 흐름** 같은 핵심 요소를 추출한 뒤,

리뷰 데이터에서 관련 불만 패턴을 검색해 **리스크 리포트** 형태로 제공한다.

즉, 출시 후 문제가 발생한 뒤 원인을 찾는 것이 아니라,

**기획 단계에서 미리 위험 요소를 점검하고 수정 방향을 제안하는 기능**이다.

### 핵심 기능

- **게임 기획안 구조화**
    - 입력된 기획안에서 장르, 핵심 플레이, 광고 방식, 보상 구조, 난이도 구조 등을 추출
- **저평점 리뷰 기반 RAG 검색**
    - 플레이스토어 저평점 리뷰를 벡터 데이터로 저장해두고, 기획 요소와 관련된 불만 사례를 검색
- **리뷰 노이즈 제거 및 불만 패턴 정리**
    - 욕설, 단순 감정 표현, 의미 없는 짧은 리뷰는 제거하고
    - 광고 피로, 조작 불편, 반복 피로, 난이도 문제 등 핵심 불만 유형으로 정리
- **기획 리스크 리포트 생성**
    - 예상 불만 요소
    - 근거가 되는 유사 리뷰 요약
    - 위험도
    - 기획 보완 제안 제공
- **기획 보완 포인트 제안**
    - 광고 빈도 조정 필요
    - 튜토리얼 강화 필요
    - 후반 난이도 완화 필요
    - 반복 구간 개선 필요 등 실질적인 수정 방향 제안

### 사용자 이용 흐름

1. 사용자가 게임 기획안 또는 아이디어를 입력한다
2. 시스템이 기획안의 핵심 요소를 구조화한다
3. 구조화된 요소를 기준으로 플레이스토어 저평점 리뷰를 검색한다
4. 검색된 리뷰에서 반복적으로 나타나는 불만 패턴을 추출한다
5. 시스템이 예상 리스크와 개선 포인트를 리포트 형태로 생성한다
6. 사용자는 이를 바탕으로 기획안을 수정하거나 우선 검토 항목을 정리한다

한 줄로 정리하면:

**기획안 입력 → 핵심 요소 추출 → 저평점 리뷰 검색 → 불만 패턴 분석 → 리스크 리포트 생성**

이렇게 만들건데 이거에 맞게 현재 md 파일 수정, 필요한 md파일 생성, 스킬, 프롤그인, 컨텍스트 엔지니어링등 해줘

---

### [2026-03-31 10:04:25]

어떤 Ai 도구 사용할건지 알려줄래?

---

### [2026-03-31 10:04:51]

<ide_opened_file>The user opened the file c:\IT\supercent_project\PROJECT_PLAN.md in the IDE. This may or may not be related to the current task.</ide_opened_file>
api비용 따로 결제해야하는건가?

---

### [2026-03-31 10:05:39]

이게 지금 가장 가성비있게 사용할수있는 모델들임?

---

### [2026-03-31 10:06:33]

클로드 pro사용해도 api비용은 따로 내야하지

---

### [2026-03-31 10:07:28]

**④ 프로토타이핑 계획**

- 프로토타입 목적
- 구현 범위
- 사용할 도구
- 입력 데이터 및 출력 방식

**⑤ 프로토타이핑 방법**

- 실제 프로토타입을 제작한 방식

이거 계획을 먼저 세우고 만들기 시작하면 될거같은데

---

### [2026-03-31 10:08:55]

프로토타입에서는 어느정도로 정해놓고 하나?
방식은 어떤걸 추천함?
supabase계정은 없어

---

### [2026-03-31 10:09:30]

저렇게 쓰면 api비용 얼마나 나오려나

---

### [2026-03-31 10:10:49]

구글 계정 새로만들어서 무료토큰 쓰면안댐?

---

### [2026-03-31 10:11:07]

<ide_opened_file>The user opened the file c:\IT\supercent_project\PROJECT_PLAN.md in the IDE. This may or may not be related to the current task.</ide_opened_file>
결제는 선결제 방시깅ㅁ?

---

### [2026-03-31 10:11:39]

일단 계획서 먼저 마무리하자

---

### [2026-03-31 10:13:47]

<ide_opened_file>The user opened the file c:\IT\supercent_project\CONTEXT_ENGINEERING.md in the IDE. This may or may not be related to the current task.</ide_opened_file>
입력데이터 게임수 20개 리뷰 100개
언어는 한국어만 
출력 방식 Vercel 배포까지 해야할듯

---

### [2026-03-31 10:15:46]

그건 나중에 만드는게 어때

---

### [2026-03-31 10:17:49]

<ide_opened_file>The user opened the file c:\IT\supercent_project\CONTEXT_ENGINEERING.md in the IDE. This may or may not be related to the current task.</ide_opened_file>
우대사항
[필요기술 (필수 X)]
• 본 포지션은 특정 기술의 숙련도 보다 AI를 중심으로 다양한 기술을 이해하고 조합하는 감각을 중요하게 생각합니다.
• 일부 경험이 있거나 학습 중이어도 충분하며, 아래는 각 영역별 권장 기술 스택입니다
• 프론트엔드: React, Next.js, Vue
• 백엔드: Node.js, Python (FastAPI, Django)
• 앱 개발: Flutter, React Native, Kotlin, Swift
• 데이터베이스: MySQL, PostgreSQL, Firebase
• 인프라 운영: AWS, GCP, Docker, Kubernetes
• AI API 활용: OpenAI API, Hugging Face, Stability AI
• 오케스트레이션: LangChain, Firebase Functions, GitHub Actions
해당 공고에서 원하는 기술 스택인데, aws쓰는게 낫지않음?

---

### [2026-03-31 10:21:46]

깃허브랑 연동해서 만들었음

---

### [2026-03-31 10:22:01]

첫번째

---

### [2026-03-31 10:22:08]

ㅇㅇ

---

### [2026-03-31 10:23:42]

이렇게 뜨는데

---

### [2026-03-31 10:24:03]

이렇게뜸

---

### [2026-03-31 10:25:33]

여기맞음?

---

### [2026-03-31 10:26:01]

URL : https://wyvqkugvnepkqyopmsxh.supabase.co

anon_public : eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Ind5dnFrdWd2bmVwa3F5b3Btc3hoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ4OTc3MzEsImV4cCI6MjA5MDQ3MzczMX0.1KYvu0LgCwFtLPbsIIGJUTPdXi-flQR1XtTOzVRhcVY

service_role : eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Ind5dnFrdWd2bmVwa3F5b3Btc3hoIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NDg5NzczMSwiZXhwIjoyMDkwNDczNzMxfQ.B-Mj8Rb7ErTT2XoHdIRnaKgIE16NEdJo4dJnX-47MWY

---

### [2026-03-31 10:26:42]

ㅇㅇ

---

### [2026-03-31 10:27:33]

됐음

---

### [2026-03-31 10:27:41]

계정있음

---

### [2026-03-31 10:29:45]

antropic : sk-ant-api03-***[REDACTED]***

OpenAI : sk-proj-***[REDACTED]***

---

### [2026-03-31 10:31:14]

<ide_opened_file>The user opened the file c:\IT\supercent_project\.claude\agents\pipeline-agent\AGENT.md in the IDE. This may or may not be related to the current task.</ide_opened_file>
너한테 명령할때 
PROJECT_PLAN, VIBE_CODING_LOG 참고해서 파일만들어줘 이런식으로 말하면되는거냐?

---

### [2026-03-31 10:31:39]

프로젝트 만들려면 어떤식으로 명령해야할까?

---

### [2026-03-31 10:32:37]

<ide_opened_file>The user opened the file c:\IT\supercent_project\.claude\agents\pipeline-agent\AGENT.md in the IDE. This may or may not be related to the current task.</ide_opened_file>
잘 만들어졌는지 검수하는 놈도 있음 지금?

---

### [2026-03-31 10:32:54]

만들면 토큰 많이 낭비하나?

---

### [2026-03-31 10:33:18]

**1단계 - 파이프라인**

`AGENT_PROMPTS.md랑 CONTEXT_ENGINEERING.md 참고해서 
pipeline 폴더에 scraper.py, preprocessor.py, embedder.py, requirements.txt 만들어줘`

---

### [2026-03-31 10:36:37]

테스트해봐

---

### [2026-03-31 10:47:53]

<ide_opened_file>The user opened the file c:\IT\supercent_project\pipeline\embedder.py in the IDE. This may or may not be related to the current task.</ide_opened_file>
이거 왜 안되냐

---

### [2026-03-31 10:48:25]

지금 한국어 리뷰 수집까지 된거같은데 전처리한다면서 respond를 안하는데 그 이유

---

### [2026-03-31 10:48:47]

api비용 사용 현황은 어디서봐?

---

### [2026-03-31 10:49:14]

선결제안했는데 걍 사용되냐?

---

### [2026-03-31 10:50:09]

어디로들어감

---

### [2026-03-31 10:50:47]

5달러면 얼마나 쓰냐

---

### [2026-03-31 10:51:12]

근데 오류나면 더 시도해볼수도있잖아

---

### [2026-03-31 10:52:07]

ㅇㅇ 충전은 조금 있다가 할거라 지금 1단계 한거 요약 md로 뭐 만들었는지 적어주고, 오류났던부분 어떻게 해결했는지 넣어놔줘 그리고 내 github에 repo만들어서 push하고싶은데

---

### [2026-03-31 11:05:35]

이거 openai api꼭써야함?

---

### [2026-03-31 11:06:08]

응 그렇게 가자

---

### [2026-03-31 11:10:05]

<ide_opened_file>The user opened the file c:\IT\supercent_project\.env.local in the IDE. This may or may not be related to the current task.</ide_opened_file>
내가 직접 넣음

---

### [2026-03-31 11:10:21]

코드 복붙해서 run돌림

---

### [2026-03-31 11:10:29]

5달러 충전 완료

---

### [2026-03-31 11:10:54]

그전에 요약이랑 깃허브에 push먼저하고 차례대로 하고싶음

---

### [2026-03-31 11:11:27]

https://github.com/myoungrel/supercent.git

---

