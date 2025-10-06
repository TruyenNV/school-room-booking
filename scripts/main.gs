function runFormCreation() {
  const weekName = "Tuần 06 (13/10-18/10)";
  const roomList = ["01", "02", "03", "04", "05", "06"];
  FormGenerator.createWeeklyForms(weekName, roomList); // Gọi hàm tạo form chính
}
function clearAllFormTriggers() {
  FormGenerator.deleteAllTriggers();
}