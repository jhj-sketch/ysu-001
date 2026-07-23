# 대학 창업자 현황 관리 시스템

재학생·졸업생 창업자 레지스트리 + 졸업자 조사 + 프로그램 추천·참여 이력 + 성과보고 엑셀 다운로드.

## 기술 스택

- Next.js (App Router) + TypeScript + Tailwind
- Prisma + SQLite (로컬 기본) — Supabase PostgreSQL로 전환 가능
- JWT 쿠키 세션 인증 + RBAC (`STUDENT` / `DEPT_STAFF` / `CENTER_STAFF` / `ADMIN`)
- SheetJS 엑셀 import/export

## 시작하기

```bash
cd student-founder-management
npm install
npx prisma migrate dev
npm run db:seed
npm run dev
```

브라우저에서 http://localhost:3000

### 데모 계정 (비밀번호: `password123`)

| 이메일 | 역할 |
|---|---|
| center@univ.ac.kr | 센터 담당자 |
| dept@univ.ac.kr | 학과 담당자 (경영학과) |
| student@univ.ac.kr | 학생 |
| admin@univ.ac.kr | 시스템 관리자 |

## Supabase 전환

1. Supabase 프로젝트 생성 후 Postgres connection string 확보
2. `.env`의 `DATABASE_URL`을 PostgreSQL URL로 변경
3. `prisma/schema.prisma`의 `provider`를 `postgresql`로 변경
4. `npx prisma migrate deploy` 실행
5. (선택) `NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_ANON_KEY` 설정

로컬은 SQLite + 쿠키 세션으로 바로 동작합니다. Supabase Auth는 환경변수 설정 시 확장할 수 있도록 클라이언트를 준비해 두었습니다.

## 주요 기능

- 창업자/기업 분리 등록, 학번·사업자번호 중복 검사, 사업자등록증 첨부
- 센터 승인/반려 → 공식 통계 반영
- 졸업자 조사 회차·명단 업로드·학과 상태 체크·응답률
- 엑셀/CSV 가져오기 (컬럼 매핑·검증·오류행)
- 프로그램 규칙 추천, 신청·참여·상담 메모
- 성과보고 XLSX 다운로드, 감사 로그

## GitHub로 관리하기

이 폴더는 Git 저장소로 초기화되어 있습니다. `.env`, `node_modules`, 로컬 DB, 업로드 파일은 `.gitignore`로 제외됩니다.

### 1) GitHub에 저장소 만들기 (CLI)

```bash
gh auth login
gh repo create student-founder-management --private --source=. --remote=origin --push
```

### 2) 웹에서 만든 뒤 연결하기

GitHub에서 빈 저장소를 만든 다음:

```bash
git remote add origin https://github.com/<USERNAME>/student-founder-management.git
git branch -M main
git push -u origin main
```

### 주의

- `.env`는 커밋하지 마세요. 클론 후 `.env.example`을 복사해 `.env`를 만드세요.
- 데모 계정 비밀번호는 운영 환경에서 반드시 변경하세요.
