const eventService = require("../services/event.service");

const createEvent = async (req, res) => {
  try {
    const { title, description, timeSlots } = req.body;
    if (!title || !timeSlots?.length)
      return res
        .status(400)
        .json({ message: "title과 timeSlots는 필수입니다." });

    const result = await eventService.createEvent({
      hostId: req.user.id,
      title,
      description,
      timeSlots,
    });
    res.status(201).json(result);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

const getEvent = async (req, res) => {
  try {
    const result = await eventService.getEvent(req.params.id);
    res.status(200).json(result);
  } catch (err) {
    res.status(404).json({ message: err.message });
  }
};

const vote = async (req, res) => {
  try {
    const { votes } = req.body;
    if (!votes?.length)
      return res.status(400).json({ message: "votes는 필수입니다." });

    const result = await eventService.vote({
      userId: req.user.id,
      eventId: req.params.id,
      votes,
    });
    res.status(200).json(result);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

const confirmEvent = async (req, res) => {
  try {
    const { slotId } = req.body;
    if (!slotId)
      return res.status(400).json({ message: "slotId는 필수입니다." });

    const result = await eventService.confirmEvent({
      eventId: req.params.id,
      hostId: req.user.id,
      slotId,
    });
    res.status(200).json(result);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

module.exports = { createEvent, getEvent, vote, confirmEvent };
