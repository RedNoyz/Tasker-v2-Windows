const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("electronAPI", {
	openNewTaskWindow: () => ipcRenderer.send("open-new-task-window"),
});
