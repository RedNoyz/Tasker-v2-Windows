const new_task_button = document.getElementById("new_task_button");

new_task_button.addEventListener("click", () => {
	window.electronAPI.openNewTaskWindow();
});
