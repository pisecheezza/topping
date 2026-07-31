const SHEET_ID = "14DVjPLKuq4pkBjoAw_h1J0BanWgJif4jNSw-6qhU4q0";

const TABS = {
  main: "Main",
  profile: "Profile",
  gallery: "Gallery",
  pages: "Pages",
  reader: "Reader",
  links: "Links",
  guestbook: "Guestbook"
};

const SITE_TITLE = "Web Retreat";

// drive file ID direct link
function driveImageUrl(fileId) {
  if (!fileId) return "";
  return `https://lh3.googleusercontent.com/d/${fileId.trim()}=s0`;
}

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
