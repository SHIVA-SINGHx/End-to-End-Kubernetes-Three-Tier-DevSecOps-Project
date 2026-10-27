const Task = require("../models/task");
const mongoose = require("mongoose");
const express = require("express");
const router = express.Router();

router.post("/", async (req, res) => {
    const taskText = req.body && typeof req.body.task === "string"
        ? req.body.task.trim()
        : "";
    if (!taskText) {
        return res.status(400).json({ message: "Task text is required." });
    }

    if (mongoose.connection.readyState !== 1) {
        return res.status(503).json({
            message: "Database is not connected. Start MongoDB and try again.",
        });
    }

    try {
        const task = await new Task({ task: taskText }).save();
        res.status(201).send(task);
    } catch (error) {
        console.error("Could not save task.", error);
        res.status(500).json({ message: "Could not save task." });
    }
});

router.get("/", async (req, res) => {
    try {
        const tasks = await Task.find();
        res.send(tasks);
    } catch (error) {
        res.send(error);
    }
});

router.put("/:id", async (req, res) => {
    try {
        const task = await Task.findOneAndUpdate(
            { _id: req.params.id },
            req.body
        );
        res.send(task);
    } catch (error) {
        res.send(error);
    }
});

router.delete("/:id", async (req, res) => {
    try {
        const task = await Task.findByIdAndDelete(req.params.id);
        res.send(task);
    } catch (error) {
        res.send(error);
    }
});

module.exports = router;
