import { Component } from "react";
import {
    addTask,
    getTasks,
    updateTask,
    deleteTask,
} from "./services/taskServices";

class Tasks extends Component {
    state = { tasks: [], currentTask: "", error: "", isSubmitting: false };

    async componentDidMount() {
        try {
            const { data } = await getTasks();
            this.setState({ tasks: data });
        } catch (error) {
            this.setState({
                error: "Could not load tasks. Check that the backend and MongoDB are running.",
            });
        }
    }

    handleChange = ({ currentTarget: input }) => {
        this.setState({ currentTask: input.value, error: "" });
    };

    handleSubmit = async (e) => {
        e.preventDefault();
        const taskText = this.state.currentTask.trim();
        if (!taskText) {
            this.setState({ error: "Enter a task before adding it." });
            return;
        }

        this.setState({ error: "", isSubmitting: true });
        try {
            const { data } = await addTask({ task: taskText });
            if (!data || !data._id || typeof data.task !== "string") {
                throw new Error("The server returned an invalid task.");
            }
            this.setState((state) => ({
                tasks: [...state.tasks, data],
                currentTask: "",
                error: "",
                isSubmitting: false,
            }));
        } catch (error) {
            const responseMessage = error.response && error.response.data
                ? error.response.data.message
                : "";
            const message = responseMessage || "Could not save the task. Check that the backend and MongoDB are running.";
            this.setState({ error: message, isSubmitting: false });
        }
    };

    handleUpdate = async (currentTask) => {
        const originalTasks = this.state.tasks;
        try {
            const tasks = [...originalTasks];
            const index = tasks.findIndex((task) => task._id === currentTask);
            tasks[index] = { ...tasks[index] };
            tasks[index].completed = !tasks[index].completed;
            this.setState({ tasks });
            await updateTask(currentTask, {
                completed: tasks[index].completed,
            });
        } catch (error) {
            this.setState({ tasks: originalTasks });
            console.log(error);
        }
    };

    handleDelete = async (currentTask) => {
        const originalTasks = this.state.tasks;
        try {
            const tasks = originalTasks.filter(
                (task) => task._id !== currentTask
            );
            this.setState({ tasks });
            await deleteTask(currentTask);
        } catch (error) {
            this.setState({ tasks: originalTasks });
            console.log(error);
        }
    };
}

export default Tasks;
