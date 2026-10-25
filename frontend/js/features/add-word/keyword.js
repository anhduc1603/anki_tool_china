// Tu khoa tim anh lay tu nghia cua tu (ham thuan, khong DOM).

// "qua tao, trai cay (danh tu)" -> "qua tao": lay phan dau truoc dau phay, cham phay hoac ngoac
export function keywordFromMeaning(meaning) {
  return String(meaning || "").split(/[,;，；(（]/)[0].replace(/\s+/g, " ").trim();
}
