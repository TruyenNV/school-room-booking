var Config = {
  /**
   * ID thư mục Drive để chứa file cấu hình và file kết quả
   */
  rootFolderId: "12345678901AbCDefGhIjKlMnOPqRsTUvWxYz",
  /**
   * ID file chứa cấu hình động
   * Mở file đó trên Google Sheets.
   * Nhìn trên URL của file, ví dụ:
   * https://docs.google.com/spreadsheets/d/1AbCDefGhIjKlMnOPqRsTUvWxYz1234567890/edit#gid=0
   * 👉 Phần nằm giữa /d/ và /edit chính là Spreadsheet ID: 1AbCDefGhIjKlMnOPqRsTUvWxYz1234567890
   */
  configSpreadsheetId: "1AbCDefGhIjKlMnOPqRsTUvWxYz1234567890",
  daysOfWeek: ["Thứ 2", "Thứ 3", "Thứ 4", "Thứ 5", "Thứ 6", "Thứ 7"],
  sessions: ["SA", "CH"],
  periods: ["Tiết 1", "Tiết 2", "Tiết 3", "Tiết 4", "Tiết 5"],
  gradeLevels: ["Khối 6", "Khối 7", "Khối 8", "Khối 9"],
  classes: [
    "A1", "A2", "A3", "A4", "A5", "A6", "A7", "A8", "A9",
    "A10", "A11", "A12", "A13", "A14", "A15", "A16", "A17", "A18",
    "BD HS Giỏi"
  ],
  roomNameRefix: "Phong ",
  resultSheetNameRefix: "Kết quả đăng ký - ",
  getFormTitle(roomName, weekName) {
    return `Đăng ký phòng bộ môn ${roomName} - ${weekName}`;
  },
  labels: {
    yourName: "Tên giáo viên",
    classRoom: "Phòng",
    gradeLevels: "Khối",
    classes: "Lớp",
    purposeOfUse: "Nội dung giảng dạy",
    fullyBooked: "❌ Hết tiết khả dụng"
  }
};