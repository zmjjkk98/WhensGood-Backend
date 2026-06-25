const express = require("express");
const {
  createEvent,
  getEvent,
  vote,
  confirmEvent,
} = require("../controllers/event.controller");
const { authenticate } = require("../middlewares/auth.middleware");

const router = express.Router();

router.post("/", authenticate, createEvent); // 이벤트 생성
router.get("/:id", getEvent); // 이벤트 조회 (비로그인도 가능)
router.post("/:id/vote", authenticate, vote); // 투표
router.patch("/:id/confirm", authenticate, confirmEvent); // 확정

module.exports = router;
