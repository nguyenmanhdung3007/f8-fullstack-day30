class Todo {
  constructor() {
    this.tasks = []; // khởi tạo biến chứa danh sách công việc

    // DOM
    this.taskList = document.querySelector("#task-list");
    this.todoInput = document.querySelector("#todo-input");
    this.todoSubmitBtn = document.querySelector("#submit");
  }

  init() {
    // load và render task lần đầu
    this._loadAndRenderTasks();

    // lắng nghe sự kiện btn trên task
    this.taskList.addEventListener("click", this._handleTaskAction);

    // lắng nghe sự kiện add task
    this.todoSubmitBtn.addEventListener("click", this._addTask);
  }

  async _loadAndRenderTasks() {
    try {
      const data = await axios.get("http://localhost:3000/tasks");
      this.tasks = [...data.data];
      this._renderTasks(this.tasks);
    } catch (error) {
      this.taskList.innerHTML = `<li class="empty-message">Có lỗi khi load danh sách tasks:${error}</li>`; // Hiển thị thông báo nếu danh sách rỗng
      alert(`Có lỗi khi load danh sách tasks: ${error} `);
      console.log("Có lỗi khi load danh sách tasks: ", error);
      return;
    }
  }

  // Render task ra giao diện
  async _renderTasks(tasks) {
    if (!tasks.length) {
      this.taskList.innerHTML =
        '<li class="empty-message">No tasks available.</li>'; // Hiển thị thông báo nếu danh sách rỗng
      return;
    }
    // Tạo html để render tasks
    const html = tasks
      .map((task) => {
        return `<li class="task-item ${
          task.completed ? "completed" : "" // Thêm class "completed" nếu công việc đã hoàn thành
        }" data-id="${task.id}">
        <span class="task-title">${this._escapeHTML(
          // escape tiêu đề công việc
          task.title
        )}</span> 
        <div class="task-action">
            <button class="task-btn edit" type="button">Edit</button> <!-- Nút sửa -->
            <button class="task-btn done">${
              task.completed ? "Mark as undone" : "Mark as done"
            }</button> <!-- Nút hoàn thành -->
            <button class="task-btn delete">Delete</button> <!-- Nút xóa -->
        </div>
    </li>`;
      })
      .join("");

    this.taskList.innerHTML = html; // Chèn HTML vào danh sách
  }

  // Xử lý các hành động trên công việc (sửa, đánh dấu hoàn thành, xóa)
  _handleTaskAction = async (e) => {
    // sử dụng delegation để lấy ra task đang bấm
    const taskItem = e.target.closest(".task-item");
    if (!taskItem) return;

    // lấy ra id của task
    const taskId = taskItem.dataset.id;
    // lấy ra task tương ứng vs id
    const task = this.tasks.find((task) => task.id === taskId);

    // sửa công việc
    if (e.target.closest(".edit")) {
      let newTitle = prompt("Enter the new task title:", task.title); // Hỏi người dùng tiêu đề mới

      if (newTitle === null) return; // Hủy nếu người dùng bấm Cancel

      newTitle = newTitle.trim(); // Xóa khoảng trắng thừa

      console.log(newTitle);

      if (!newTitle) {
        alert("Task title cannot be empty!"); // Cảnh báo nếu tiêu đề rỗng
        return;
      }

      if (this._isDuplicateTask(newTitle, taskId)) {
        alert(
          "Task with this title already exists! Please use a different task title!"
        ); // Cảnh báo nếu tiêu đề trùng lặp
        return;
      }

      this._updateTask(taskId, { title: newTitle });
      return;
    }

    // Đánh dấu hoàn thành hoặc chưa hoàn thành
    if (e.target.closest(".done")) {
      this._updateTask(taskId, { completed: !task.completed }); // update lại task
      return;
    }

    if (e.target.closest(".delete")) {
      if (confirm(`Are you sure you want to delete "${task.title}"?`)) {
        this._deleteTask(taskId);
        return;
      }
    }
  };

  _addTask = async (e) => {
    e.preventDefault(); // Ngăn chặn hành vi mặc định của form khi ấn submit
    const value = this.todoInput.value.trim(); // Lấy giá trị input và xóa khoảng trắng thừa
    if (!value) {
      return alert("Please write something!"); // Cảnh báo nếu input rỗng
    }

    if (this._isDuplicateTask(value)) {
      alert(
        "Task with this title already exists! Please use a different title."
      ); // Cảnh báo nếu tiêu đề trùng lặp
      return;
    }

    const newTask = { title: value, completed: false };
    this._createTask(newTask);
    this.todoInput.value = "";
  };

  // CREATE TASK
  async _createTask(opt) {
    axios
      .post(`http://localhost:3000/tasks/`, opt)
      .then((res) => {
        const newTask = res.data;
        console.log(newTask);
        this.tasks.unshift(newTask);
        this._renderTasks(this.tasks);
      })
      .catch((error) => {
        alert("Không thể nhập thêm task mới!!!", error);
        console.log(error);
      });
  }

  // DELETE TASK
  async _deleteTask(taskId) {
    axios.delete(`http://localhost:3000/tasks/${taskId}`).then((response) => {
      console.log("vừa xóa task", response.data);
    });
    // cập nhật lại mảng task
    this.tasks = this.tasks.filter((task) => task.id !== taskId);
    this._renderTasks(this.tasks);
  }

  // UPDATE TASK
  async _updateTask(taskId, opt) {
    axios
      .patch(`http://localhost:3000/tasks/${taskId}`, opt)
      .then((response) => {
        const task = this.tasks.find((task) => task.id === taskId);
        // Cập nhật trong this.tasks
        if (task) Object.assign(task, response.data);
        // render lại task
        this._renderTasks(this.tasks);
      })
      .catch((error) => {
        alert(`Lỗi khi sửa: ${error}`);
      });
  }

  // Hàm kiểm tra trùng lặp khi chỉnh sửa/thêm 1 task mới
  _isDuplicateTask(newTitle, taskId = -1) {
    console.log(this.taskList);
    const isDuplicate = this.tasks.some(
      (task) =>
        task.title.toLowerCase() === newTitle.toLowerCase() && // So sánh không phân biệt chữ hoa/thường
        taskId !== task.id // Loại trừ công việc đang chỉnh sửa
    );
    return isDuplicate; // Trả về true nếu trùng, false nếu không
  }

  // Hàm xử lý chống xss
  _escapeHTML(html) {
    // Kiểm tra input có hợp lệ không
    if (typeof html !== "string") {
      return "";
    }
    const tempDiv = document.createElement("div"); // Tạo một temporary div element để sử dụng textContent
    tempDiv.textContent = html; // textContent tự động escape các ký tự đặc biệt
    return tempDiv.innerHTML;
  }
}

document.addEventListener("DOMContentLoaded", () => {
  const todo = new Todo();
  todo.init();
});
