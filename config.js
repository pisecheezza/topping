// ── 여기만 수정하면 됩니다 ────────────────────────────────
// 1) 구글 스프레드시트를 "링크가 있는 모든 사용자 - 보기 가능"으로 공유 설정
// 2) 시트 URL에서 /d/ 와 /edit 사이의 긴 문자열을 SHEET_ID에 붙여넣기
//    예: https://docs.google.com/spreadsheets/d/여기부분/edit
const SHEET_ID = "14DVjPLKuq4pkBjoAw_h1J0BanWgJif4jNSw-6qhU4q0";

// 3) 각 탭(시트)의 이름이 아래와 다르면 맞춰서 수정
const TABS = {
  Main: "Main",
  Profile: "Profile",
  Storage: "Storage",
  Links: "Links"
};

// 4) 사이트 제목 / 한줄소개 기본값 (Profile 시트에 name/tagline 키가 있으면 그 값이 우선 적용됨)
const SITE_DEFAULTS = {
  name: "Sage",
  tagline: "個人HPと言う空間を作り出すのだ。"
};

// 드라이브 파일 ID로 이미지 직링크 만들기
function driveImageUrl(fileId) {
  if (!fileId) return "";
  return `https://drive.google.com/uc?export=view&id=${fileId.trim()}`;
}
