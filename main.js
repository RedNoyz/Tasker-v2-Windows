const path = require("path");
const { app, BrowserWindow, globalShortcut, ipcMain, dialog } = require("electron");
const Database = require("better-sqlite3");

const fs = require("fs");
const logFile = path.join(app.getPath("userData"), "startup.log");

function log(msg) {
	fs.appendFileSync(logFile, `[${new Date().toISOString()}] ${msg}\n`);
}

log("App launched");

app.disableHardwareAcceleration();
app.commandLine.appendSwitch("disable-gpu");

let task_window_open = false;

let main_window;
let task_window;

let data_base;

function initializeDatabase() {
	const data_base_path = path.join(__dirname, "tasks.db");

	data_base = new Database(data_base_path);

	data_base
		.prepare(
			`CREATE TABLE IF NOT EXISTS tasks (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            due_date TIMESTAMP,
            created_at TIMESTAMP DEFAULT (datetime('now', 'localtime')),
            notified INTEGER DEFAULT 0,
            status TEXT DEFAULT 'open',
            complete_date TIMESTAMP,
            snooze_counter INTEGER DEFAULT 0)`
		)
		.run();
}

function createMainWindow() {
	main_window = new BrowserWindow({
		width: 800,
		height: 600,
		x: 100,
		y: 100,
		show: false,
		transparent: false,
		backgroundColor: "#000000",
		webPreferences: {
			contextIsolation: true,
			nodeIntegration: false,
			preload: path.join(__dirname, "renderer/preload.js"),
		},
	});

	main_window.loadFile(path.join(__dirname, "./renderer/index.html"));

	main_window.once("ready-to-show", () => {
		log("Window ready to show");
		main_window.show();
	});

	main_window.on("show", () => {
		log("Main window is now visible");
	});

	if (!app.isPackaged) {
		main_window.webContents.openDevTools({ mode: "detach" });
	}

	main_window.on("close", () => {
		if (task_window && !task_window.isDestroyed()) {
			task_window.close();
		}
	});
}

app.whenReady().then(() => {
	log("App ready");

	initializeDatabase();
	log("Database initialized");

	createMainWindow();
	log("Main window created");

	if (app.isPackaged) {
		const { autoUpdater } = require("electron-updater");

		autoUpdater.checkForUpdatesAndNotify();

		autoUpdater.on("update-available", () => {
			dialog.showMessageBox({
				type: "info",
				title: "Update Available",
				message: "A new version is available. Downloading now...",
			});
		});

		autoUpdater.on("update-downloaded", () => {
			dialog.showMessageBox({
				type: "info",
				title: "Update Ready",
				message: "Update downloaded. It will be installed on restart.",
			});
		});
	} else {
		console.log("🛠 Development mode detected. AutoUpdater disabled.");
	}

	const shortcutRegistered = globalShortcut.register("Control+Shift+Space", () => {
		console.log("Keybind was pressed.");
		if (task_window_open == false) {
			task_window_open = true;
			createNewTaskWindow();
		} else {
			console.log("Window Already Open.");
		}
	});

	autoUpdater.on("update-available", () => {
		dialog.showMessageBox({
			type: "info",
			title: "Update Available",
			message: "A new version is available. Downloading now...",
		});
	});

	autoUpdater.on("update-downloaded", () => {
		dialog.showMessageBox({
			type: "info",
			title: "Update Ready",
			message: "Update downloaded. It will be installed on restart.",
		});
	});
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

ipcMain.on("open-new-task-window", () => {
	if (!task_window) {
		createNewTaskWindow();
	}
});

app.on("window-all-closed", () => {
	if (process.platform !== "darwin") app.quit();
});
