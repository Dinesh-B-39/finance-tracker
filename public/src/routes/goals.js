const express = require('express');
const router = express.Router();
const Goal = require('../models/Goal');

router.get('/', async (req, res) => {
    try {
        const goals = await Goal.find();
        res.json(goals);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

router.post('/', async (req, res) => {
    const goal = new Goal({
        name: req.body.name,
        targetAmount: req.body.targetAmount,
        currentAmount: req.body.currentAmount,
        deadline: req.body.deadline
    });

    try {
        const newGoal = await goal.save();
        res.status(201).json(newGoal);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

router.put('/:id', async (req, res) => {
    try {
        const goal = await Goal.findById(req.params.id);
        goal.currentAmount = Math.min(goal.targetAmount, goal.currentAmount + req.body.amount);
        const updatedGoal = await goal.save();
        res.json(updatedGoal);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

router.delete('/:id', async (req, res) => {
    try {
        await Goal.findByIdAndDelete(req.params.id);
        res.json({ message: 'Goal deleted' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

module.exports = router;