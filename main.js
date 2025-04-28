const path = require("path");
const { app, BrowserWindow, globalShortcut, ipcMain } = require("electron");

let task_window_open = false;

let main_window;
let task_window;

function createMainWindow() {
	main_window = new BrowserWindow({
		width: 800,
		height: 600,
		webPreferences: {
			contextIsolation: true,
			nodeIntegration: false,
			preload: path.join(__dirname, "./renderer/preload.js"),
		},
	});

	main_window.loadFile(path.join(__dirname, "./renderer/index.html"));

	main_window.on("close", () => {
		if (task_window && !task_window.isDestroyed()) {
			task_window.close();
		}
	});
}

app.whenReady().then(() => {
	createMainWindow();
});

function createNewTaskWindow() {
	task_window = new BrowserWindow({
		width: 830,
		height: 380,
	});

	task_window.loadFile(path.join(__dirname, "./renderer/new_task.html"));

	task_window.on("closed", () => {
		task_window_open = false;
		console.log("Task Window Closed. Flag Reset.");
	});
}

app.whenReady().then(() => {
	const shortcutRegistered = globalShortcut.register("Control+Shift+Space", () => {
		console.log("Keybind was pressed.");
		if (task_window_open == false) {
			task_window_open = true;
			createNewTaskWindow();
		} else {
			console.log("Window Already Open.");
		}
	});
});

ipcMain.on("open-new-task-window", () => {
	if (!task_window) {
		createNewTaskWindow();
	}
});

app.on("window-all-closed", () => {
	if (process.platform !== "darwin") app.quit();
});
