# 수학 기출 문제집 생성기 (Math Workbook Builder)

## 1. Project Description
기출 수학 시험지 PDF를 업로드하고, 화면에 표시된 PDF 위에서 마우스로 문제 영역을 드래그해
선택한 뒤, A4 4분할(2×2) 문제집 양식에 1번부터 자동으로 번호를 매겨 새 문제집을 만드는
웹 도구.

- **대상 사용자**: 수학 강사, 학원, 교사, 학생 (수학 문제를 모아 문제집을 만드는 사람)
- **핵심 가치**:
  1. 여러 개의 기출시험지를 한 곳에 모아 단원별로 문제를 정리
  2. 드래그 한 번으로 필요한 문제만 잘라서 재구성
  3. 완성된 문제집을 인쇄 가능한 A4 형식으로 즉시 출력(PDF 저장)

## 2. Page Structure
- `/login` — 로그인 / 회원가입
- `/` — 대시보드 (내가 만든 문제집 목록, 새 문제집 만들기)
- `/editor` — 문제집 편집기 (시험지 업로드 → 문제 드래그 선택 → 단원 지정 → 문제집 미리보기 → PDF 저장)
- `/editor/:id` — 저장된 문제집 다시 열기(불러오기 및 편집)
- `*` — 404 페이지

## 3. Core Features
- [ ] 이메일 기반 회원가입 / 로그인 (Supabase Auth)
- [ ] 여러 개의 기출시험지 PDF 업로드 (파일 개수 제한 없음)
- [ ] 업로드 시 파일마다 "출처 제목" 입력 → 이후 문제 출처로 사용
- [ ] PDF 페이지를 화면에 렌더링하여 표시
- [x] PDF 위에서 드래그하여 문제 영역 선택(잘라내기)
- [x] 잘라낸 문제마다 단원명 지정 및 순서 관리 (삭제 / 순서 변경)
- [x] 문제집 전체 단원을 한눈에 보고 이름 변경/해제하는 "단원 관리" 패널
- [x] "단원 관리" 패널에서 위/아래 버튼으로 단원 순서 지정 (PDF에 반영)
- [x] 단원명 드롭다운으로 입력한 단원을 빠르게 선택(직접 입력도 가능)
- [x] 문제마다 정답/해설 입력 → 단원별 답지 자동 생성
- [x] A4 4분할(2×2) 양식에 문제를 단원별로 1번부터 배치
- [x] 각 문제 하단에 출처(파일 제목)를 작은 글씨로 표시
- [x] 문제집 표지/머리에 단원명 및 제목 표시
- [x] 단원별로 각각 따로 문제집 PDF 파일로 다운로드
- [x] 문제집과 별도로 단원별 답지 PDF 다운로드
- [x] PDF 뷰어 지연 렌더로 대용량 시험지 성능 개선
- [x] 잘라내기 모드에서도 가능한 페이지 이동 네비게이터
- [x] 만든 문제집을 계정에 저장하고 나중에 다시 불러오기
- [x] 문제 카드에 정답 입력 여부 표시(정답 입력/미입력) 및 상단 진행 카운터
- [x] 저장하지 않은 변경이 있을 때 페이지 이탈/새로고침 경고

## 4. Data Model Design
(Supabase Database 사용)

### Table: workbooks
| Field | Type | Description |
|-------|------|-------------|
| id | uuid | 기본 키 |
| user_id | uuid | 소유자 (auth.users) |
| title | text | 문제집 제목 |
| unit_order | jsonb | 단원 표시 순서(배열) |
| created_at | timestamptz | 생성 시각 |
| updated_at | timestamptz | 수정 시각 |

### Table: workbook_problems
| Field | Type | Description |
|-------|------|-------------|
| id | uuid | 기본 키 |
| workbook_id | uuid | workbooks 참조 (삭제 시 함께 삭제) |
| user_id | uuid | 소유자 |
| order_index | int | 문제 순서(단원별 번호 계산의 기준) |
| unit_name | text | 문제별 단원명 |
| source_title | text | 출처(업로드한 시험지의 파일 제목) |
| page_number | int | 원본 PDF 페이지 번호 |
| image_path | text | 잘라낸 문제 이미지 저장 경로(Storage) |
| answer | text | 정답 / 해설 |
| created_at | timestamptz | 생성 시각 |

### Storage
- `workbook-assets` (비공개 버킷): 잘라낸 문제 이미지 저장

## 5. Backend / Third-party Integration Plan
- **Database/Auth/Storage**: SaaS Supabase (연결 완료)
- **Shopify**: 필요 없음
- **결제(Stripe 등)**: 필요 없음
- **기타**: PDF 렌더링(pdf.js), PDF 생성(jsPDF) — 브라우저에서 동작

## 6. Development Phase Plan

### Phase 1: 로그인 & 앱 뼈대
- Goal: 계정으로 로그인/회원가입하고, 대시보드 화면에 진입할 수 있는 기본 구조 구축
- Deliverable: 로그인/회원가입 페이지, 상단 내비게이션, 대시보드(문제집 목록 빈 상태), 보호된 라우트

### Phase 2: 시험지 PDF 업로드 & 뷰어
- Goal: 여러 기출시험지 PDF를 업로드(파일마다 출처 제목 입력)하고 화면에 페이지를 표시
- Deliverable: 업로드 영역, 파일 목록(출처 제목 편집/삭제), PDF 페이지 렌더링 뷰어

### Phase 3: 문제 드래그 선택 & 단원 지정
- Goal: PDF 위에서 드래그로 문제 영역을 잘라내고 문제 목록에 담기
- Deliverable: 드래그 선택 오버레이, 잘라낸 문제 미리보기 목록, 단원명 입력/수정, 순서 변경/삭제

### Phase 4: A4 4분할 문제집 미리보기 (단원별)
- Goal: 담은 문제를 단원별로 묶어 A4 4분할 양식에 단원마다 1번부터 배치, 출처를 작은 글씨로 표시
- Deliverable: 단원별 2×2 미리보기, 단원 순서 반영, 단원별 개별 번호 부여, 단원명/제목 머리 영역

### Phase 5: PDF 저장 & 계정 보관/불러오기 (완료)
- Goal: 완성된 문제집을 PDF로 다운로드하고 계정에 저장하여 다시 열기
- Deliverable: PDF 다운로드, 문제집 저장(DB/Storage), 대시보드 목록 연동, 저장본 다시 열기

### Phase 6: 성능 & 편의 안정화 (완료)
- Goal: 대용량 시험지에서도 끊기지 않고, 작업 도중 실수로 내용이 사라지지 않도록 보호
- Deliverable: PDF 지연 렌더, 페이지 이동 네비게이터, 정답 입력 여부 표시, 저장하지 않은 변경 시 이탈/새로고침 경고