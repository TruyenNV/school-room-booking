var FormGenerator = {
  // ===== GET OR CREATE NEW FOLDER =====
  _getBaseFolder() {
    try {
      var rootFolderId = Config.rootFolderId;
      if (rootFolderId) return DriveApp.getFolderById(rootFolderId);
    } catch (e) {
      Logger.log("⚠️ Không tìm thấy Config.rootFolderId, dùng root.");
    }
    return DriveApp.getRootFolder();
  },

  _normallizeRefix(refix) {
    return refix ?? "";
  },

  _getOrCreateNestedFolder(weekName, roomName) {
    const base = this._getBaseFolder();

    let weekFolder;
    const weekFolders = base.getFoldersByName(weekName);
    weekFolder = weekFolders.hasNext() ? weekFolders.next() : base.createFolder(weekName);

    const roomFolderName = `${this._normallizeRefix(Config.roomNameRefix)}${roomName}`;
    let roomFolder;
    const roomFolders = weekFolder.getFoldersByName(roomFolderName);
    roomFolder = roomFolders.hasNext() ? roomFolders.next() : weekFolder.createFolder(roomFolderName);

    return roomFolder;
  },

  // ===== CREATE FORM =====
  _createFormForWeek(weekName, roomName) {
    const folder = this._getOrCreateNestedFolder(weekName, roomName);
    const fileName = `${Config.labels.classRoom ? Config.labels.classRoom + " " : "" }${roomName} - ${weekName}`;

    const sheet = SpreadsheetApp.create(`${this._normallizeRefix(Config.resultSheetNameRefix)}${fileName}`);
    DriveApp.getFileById(sheet.getId()).moveTo(folder);

    const form = FormApp.create(Config.getFormTitle(roomName, weekName));
    DriveApp.getFileById(form.getId()).moveTo(folder);
    form.setDestination(FormApp.DestinationType.SPREADSHEET, sheet.getId());

    form.addTextItem().setTitle(Config.labels.yourName ?? "Tên Giáo Viên").setRequired(true);
    form.addListItem().setTitle(Config.labels.gradeLevels ?? "Khối").setChoiceValues(Config.gradeLevels).setRequired(true);
    form.addListItem().setTitle(Config.labels.classes ?? "Lớp").setChoiceValues(Config.classes).setRequired(true);
    form.addParagraphTextItem().setTitle(Config.labels.purposeOfUse ?? "Nội dung giảng dạy").setRequired(true);

    Config.daysOfWeek.forEach(day => {
      Config.sessions.forEach(session => {
        form.addCheckboxItem()
          .setTitle(`${day} - ${session}`)
          .setChoiceValues(Config.periods)
          .setRequired(false);
      });
    });

    this._updateForm(form, sheet);
    this._createFormSubmitTrigger(form.getId());

    Logger.log(`✅ Tạo form ${roomName}: ${form.getPublishedUrl()}`);
    Logger.log(`📄 Sheet: ${sheet.getUrl()}`);
    Logger.log(`📁 Folder: ${folder.getName()} (${folder.getId()})`);

    return {
      formId: form.getId(),
      sheetId: sheet.getId(),
      folderId: folder.getId()
    };
  },

  // ===== UPDATE FORM =====
  _getOccupiedSlots(sheet) {
    try {
      const dataRange = sheet.getDataRange();
      if (!dataRange) return new Set();

      const data = dataRange.getValues();
      if (!data || data.length < 2 || !data[0] || data[0].length === 0) return new Set();

      const headers = data[0];
      const occupied = new Set();

      for (let i = 1; i < data.length; i++) {
        const row = data[i] || [];
        for (let j = 0; j < headers.length && j < row.length; j++) {
          const header = headers[j];
          const cell = row[j];
          if (header && cell && typeof cell === "string") {
            const periods = cell.split(",").map(s => s.trim()).filter(Boolean);
            periods.forEach(p => occupied.add(`${header} - ${p}`));
          }
        }
      }
      return occupied;
    } catch (err) {
      Logger.log("❌ Lỗi _getOccupiedSlots(): " + err);
      return new Set();
    }
  },

  _updateForm(form, sheet) {
    try {
      const occupiedSlots = this._getOccupiedSlots(sheet);
      const checkboxItems = form.getItems(FormApp.ItemType.CHECKBOX);
      const titles = checkboxItems.map(item => item.getTitle());

      const headers = [];
      Config.daysOfWeek.forEach(day =>
        Config.sessions.forEach(session => headers.push(`${day} - ${session}`))
      );

      headers.forEach(header => {
        const available = Config.periods.filter(
          period => !occupiedSlots.has(`${header} - ${period}`)
        );
        const idx = titles.indexOf(header);

        if (idx >= 0) {
          const item = checkboxItems[idx].asCheckboxItem();
          item.setChoiceValues(
            available.length > 0 ? available : [Config.labels.fullyBooked ?? "❌ Hết tiết khả dụng"]
          );
        } else if (available.length > 0) {
          form.addCheckboxItem()
            .setTitle(header)
            .setChoiceValues(available)
            .setRequired(false);
        }
      });

      Logger.log("✅ _updateForm(): hoàn tất.");
    } catch (err) {
      Logger.log("❌ Lỗi trong _updateForm(): " + err);
    }
  },

  // ===== TRIGGER =====
  _createFormSubmitTrigger(formId) {
    try {
      this.deleteTriggersForForm(formId);
      const form = FormApp.openById(formId);
      ScriptApp.newTrigger("FormGenerator.onFormSubmit")
        .forForm(form)
        .onFormSubmit()
        .create();
      Logger.log(`🔔 Đã tạo trigger cho form: ${formId}`);
    } catch (err) {
      Logger.log("❌ Lỗi tạo trigger: " + err);
    }
  },

  deleteTriggersForForm(formId) {
    const triggers = ScriptApp.getProjectTriggers();
    triggers.forEach(t => {
      if (t.getHandlerFunction() === "FormGenerator.onFormSubmit" && t.getTriggerSourceId() === formId) {
        ScriptApp.deleteTrigger(t);
        Logger.log(`🧹 Xóa trigger cho form: ${formId}`);
      }
    });
  },

  deleteAllTriggers() {
    const triggers = ScriptApp.getProjectTriggers();
    triggers.forEach(t => ScriptApp.deleteTrigger(t));
    Logger.log(`🧹 Đã xóa toàn bộ ${triggers.length} trigger trong project.`);
  },

  listAllFormTriggers() {
    const triggers = ScriptApp.getProjectTriggers();
    if (triggers.length === 0) {
      Logger.log("Không có trigger nào.");
      return;
    }
    triggers.forEach(t => {
      Logger.log(`🔔 Trigger: ${t.getHandlerFunction()} | Type: ${t.getEventType()} | SourceID: ${t.getTriggerSourceId()}`);
    });
  },

  // ===== HANDLER ON SUBMIT =====
  onFormSubmit(e) {
    try {
      if (!e || !e.source) return;
      const form = e.source;
      const sheetId = form.getDestinationId();
      const sheet = SpreadsheetApp.openById(sheetId).getSheets()[0];
      this._updateForm(form, sheet);
      Logger.log("✅ onFormSubmit: cập nhật form xong.");
    } catch (err) {
      Logger.log("❌ Lỗi onFormSubmit: " + err);
    }
  },

  // ===== CREATE NEW FORMS =====
  createWeeklyForms(weekName, roomList) {
    const results = [];

    this.deleteAllTriggers();

    roomList.forEach(room => {
      const result = this._createFormForWeek(weekName, room);
      results.push(result);
    });

    Logger.log("🚀 Đã tạo toàn bộ form phòng:");
    results.forEach(r => Logger.log(`📋 ${r.formId} (${r.folderId})`));

    return results;
  }
};
