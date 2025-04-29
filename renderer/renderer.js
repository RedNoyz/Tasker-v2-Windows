window.addEventListener("DOMContentLoaded", () => {
	const new_task_button = document.getElementById("new_task_button");

	if (new_task_button && window.electronAPI) {
		new_task_button.addEventListener("click", () => {
			window.electronAPI.openNewTaskWindow();
		});
	}
});
