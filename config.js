// ── 여기만 수정하면 됩니다 ────────────────────────────────
// 1) 구글 스프레드시트를 "링크가 있는 모든 사용자 - 보기 가능"으로 공유 설정
// 2) 시트 URL에서 /d/ 와 /edit 사이의 긴 문자열을 SHEET_ID에 붙여넣기
const SHEET_ID = "14DVjPLKuq4pkBjoAw_h1J0BanWgJif4jNSw-6qhU4q0";

// 3) 실제 구글 시트 하단 탭 이름과 정확히 맞춰주세요 (왼쪽 키 이름은 고정, 오른쪽 값만 수정)
const TABS = {
  main: "Main",       // 대문 이미지 + 공지사항
  profile: "Profile", // 이름/직업/성별/생년월일 등 인적사항
  storage: "Storage", // 그림 + 코멘트
  pages: "Pages",      // 문서
  links: "Links",      // 링크 모음 (배너 이미지 지원)
  guestbook: "Guestbook"
};

// 4) 사이트 상단에 표시될 제목 (시트 값과 무관한 고정 텍스트)
const SITE_TITLE = "Web Retreat";

// 드라이브 파일 ID로 이미지 직링크 만들기
function driveImageUrl(fileId) {
  if (!fileId) return "";
  return `https://lh3.googleusercontent.com/d/${fileId.trim()}=s0`;
}

// Pages 탭의 link 값(파일ID 또는 전체 URL)으로 문서 열람 URL 만들기
function driveDocUrl(value) {
  if (!value) return "";
  const v = value.trim();
  if (v.startsWith("http")) return v;
  return `https://drive.google.com/file/d/${v}/view`;
}

const GUESTBOOK_WEBAPP_URL = "https://script.google.com/macros/s/AKfycbwHou9yZgkYdvwYIkeFlJeJhvZ6BjYPWLQcl5GMcl6jhi7YzpKKo9o3HTHjpjskQup9/exec";

function driveAudioUrl(fileId) {
  if (!fileId) return "";
  return `https://drive.google.com/uc?export=download&id=${fileId.trim()}`;
}

// const CLICK_SOUND_FILE_ID = "1_WcRUaGueXBl5tgqQMuqk1Z9wdARB7tp"; //
