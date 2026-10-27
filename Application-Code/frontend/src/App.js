import React from "react";
import Tasks from "./Tasks";
import "./App.css";

class App extends Tasks {
    state = { tasks: [], currentTask: "", filter: "all" };

    render() {
        const { tasks, currentTask, filter } = this.state;
        const completedCount = tasks.filter((task) => task.completed).length;
        const remainingCount = tasks.length - completedCount;
        const completionRate = tasks.length
            ? Math.round((completedCount / tasks.length) * 100)
            : 0;
        const visibleTasks = tasks.filter((task) => {
            if (filter === "active") return !task.completed;
            if (filter === "completed") return task.completed;
            return true;
        });

        return (
            <main className="app">
                <header className="topbar">
                    <div className="brand" aria-label="Focus">
                        <span className="brand-mark" aria-hidden="true">
                            <svg viewBox="0 0 24 24">
                                <path d="m6 12 4 4L18 8" />
                            </svg>
                        </span>
                        <span>focus<span className="brand-period">.</span></span>
                    </div>
                    <span className="topbar-note">
                        <span className="status-dot" />
                        Make today count
                    </span>
                </header>

                <section className="welcome-section">
                    <div className="welcome-copy">
                        <p className="eyebrow">YOUR PERSONAL WORKSPACE</p>
                        <h1>A little more focus.<br /><span>A lot more done.</span></h1>
                        <p className="welcome-description">
                            Keep your day clear and your priorities closer.
                        </p>
                    </div>
                    <div className="progress-card" aria-label={`${completionRate}% of tasks completed`}>
                        <div className="progress-ring" style={{ "--progress": `${completionRate}%` }}>
                            <div className="progress-inner">
                                <span>{completionRate}<small>%</small></span>
                            </div>
                        </div>
                        <div className="progress-copy">
                            <strong>Your progress</strong>
                            <span>{completedCount} of {tasks.length} completed</span>
                        </div>
                    </div>
                </section>

                <section className="workspace" aria-label="Task workspace">
                    <div className="workspace-heading">
                        <div>
                            <p className="eyebrow">THE PLAN</p>
                            <h2>Your tasks</h2>
                        </div>
                        <div className="remaining-pill">
                            <span>{remainingCount}</span> {remainingCount === 1 ? "task" : "tasks"} left
                        </div>
                    </div>

                    <form onSubmit={this.handleSubmit} className="task-form">
                        <span className="input-plus" aria-hidden="true">+</span>
                        <input
                            className="task-input"
                            value={currentTask}
                            required
                            onChange={this.handleChange}
                            placeholder="What needs your attention?"
                            aria-label="New task"
                        />
                        <button className="add-task-btn" type="submit">
                            <span>Add task</span>
                            <svg viewBox="0 0 20 20" aria-hidden="true">
                                <path d="M4 10h12m-5-5 5 5-5 5" />
                            </svg>
                        </button>
                    </form>

                    <div className="list-toolbar">
                        <div className="filter-tabs" role="group" aria-label="Filter tasks">
                            {[
                                ["all", "All tasks", tasks.length],
                                ["active", "In progress", remainingCount],
                                ["completed", "Completed", completedCount],
                            ].map(([value, label, count]) => (
                                <button
                                    key={value}
                                    type="button"
                                    aria-pressed={filter === value}
                                    className={filter === value ? "filter-tab active" : "filter-tab"}
                                    onClick={() => this.setState({ filter: value })}
                                >
                                    {label}<span>{count}</span>
                                </button>
                            ))}
                        </div>
                        <span className="list-count">
                            {visibleTasks.length} {visibleTasks.length === 1 ? "item" : "items"}
                        </span>
                    </div>

                    <div className="tasks-list">
                        {visibleTasks.length > 0 ? visibleTasks.map((task) => (
                            <article
                                key={task._id}
                                className={task.completed ? "task-item is-completed" : "task-item"}
                            >
                                <button
                                    type="button"
                                    className="task-check"
                                    onClick={() => this.handleUpdate(task._id)}
                                    aria-label={task.completed ? `Mark ${task.task} as active` : `Complete ${task.task}`}
                                    aria-pressed={task.completed}
                                >
                                    {task.completed && (
                                        <svg viewBox="0 0 20 20" aria-hidden="true">
                                            <path d="m4 10 4 4 8-8" />
                                        </svg>
                                    )}
                                </button>
                                <span className="task-text">{task.task}</span>
                                <button
                                    type="button"
                                    onClick={() => this.handleDelete(task._id)}
                                    className="delete-task-btn"
                                    aria-label={`Delete ${task.task}`}
                                    title="Delete task"
                                >
                                    <svg viewBox="0 0 20 20" aria-hidden="true">
                                        <path d="M4 6h12M8 6V4h4v2m2 0-.7 10H6.7L6 6m3 3v4m2-4v4" />
                                    </svg>
                                </button>
                            </article>
                        )) : (
                            <div className="empty-state">
                                <span className="empty-icon" aria-hidden="true">
                                    <svg viewBox="0 0 48 48">
                                        <path d="M15 10h18a4 4 0 0 1 4 4v25H11V14a4 4 0 0 1 4-4Z" />
                                        <path d="M18 7h12v7H18zM18 23h12m-12 7h12" />
                                    </svg>
                                </span>
                                <h3>{filter === "completed" ? "Nothing completed just yet" : filter === "active" ? "You’re all caught up" : "Your day is a blank canvas"}</h3>
                                <p>{filter === "all" ? "Add your first task above and make it happen." : "Try another filter or add a new task to your list."}</p>
                            </div>
                        )}
                    </div>

                    <footer className="workspace-footer">
                        <span><span className="footer-sparkle">✦</span> One step at a time.</span>
                        <span>{completedCount} done <span className="footer-separator">·</span> {remainingCount} to go</span>
                    </footer>
                </section>

                <footer className="page-footer">
                    <span>Made for a clearer mind.</span>
                    <span>FOCUS ON WHAT MATTERS</span>
                </footer>
            </main>
        );
    }
}

export default App;
