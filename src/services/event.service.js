const pool = require("../config/db");

const createEvent = async ({ hostId, title, description, timeSlots = [] }) => {
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    const [result] = await conn.query(
      "INSERT INTO events (host_id, title, description) VALUES(?, ?, ?)",
      [hostId, title, description],
    );
    const eventId = result.insertId;

    // 호스트를 자동 참여자로 추가
    await conn.query(
      "INSERT INTO participants (event_id, user_id) VALUES(?, ?)",
      [eventId, hostId],
    );

    // 시간 슬롯 등록
    if (timeSlots?.length > 0) {
      const slotValues = timeSlots.map(({ startTime, endTime }) => [
        eventId,
        startTime,
        endTime,
      ]);
      await conn.query(
        "INSERT INTO time_slots (event_id, start_time, end_time) VALUES ?",
        [slotValues],
      );
    }

    await conn.commit();
    return { eventId, title, description };
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
};

// 이벤트 상세 조회 (슬롯 + 투표 현황 포함)
const getEvent = async (eventId) => {
  const [events] = await pool.query(
    `SELECT e.*, u.nickname as hostNickname
     FROM events e
     JOIN users u ON e.host_id = u.id
     WHERE e.id = ?`,
    [eventId],
  );
  if (events.length === 0) throw new Error("이벤트를 찾을 수 없습니다.");

  const [slots] = await pool.query(
    `SELECT ts.id, ts.start_time, ts.end_time,
            COUNT(v.id) as voteCount
     FROM time_slots ts
     LEFT JOIN votes v ON ts.id = v.slot_id AND v.available = true
     WHERE ts.event_id = ?
     GROUP BY ts.id`,
    [eventId],
  );

  return { ...events[0], timeSlots: slots };
};

// 투표
const vote = async ({ userId, eventId, votes }) => {
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    // 참여자 등록 (없으면 추가)
    await conn.query(
      "INSERT IGNORE INTO participants (event_id, user_id) VALUES (?, ?)",
      [eventId, userId],
    );

    // 기존 투표 삭제 후 새로 등록
    const [slots] = await conn.query(
      "SELECT id FROM time_slots WHERE event_id = ?",
      [eventId],
    );
    const slotIds = slots.map((s) => s.id);

    if (slotIds.length > 0) {
      await conn.query(
        "DELETE FROM votes WHERE user_id = ? AND slot_id IN (?)",
        [userId, slotIds],
      );
    }

    if (votes?.length > 0) {
      const voteValues = votes.map(({ slotId, available }) => [
        slotId,
        userId,
        available,
      ]);
      await conn.query(
        "INSERT INTO votes (slot_id, user_id, available) VALUES ?",
        [voteValues],
      );
    }

    await conn.commit();
    return { message: "투표가 완료됐습니다." };
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
};

// 이벤트 확정
const confirmEvent = async ({ eventId, hostId, slotId }) => {
  const [events] = await pool.query(
    "SELECT * FROM events WHERE id = ? AND host_id = ?",
    [eventId, hostId],
  );
  if (events.length === 0)
    throw new Error("권한이 없거나 이벤트가 존재하지 않습니다.");

  const [slot] = await pool.query(
    "SELECT * FROM time_slots WHERE id = ? AND event_id = ?",
    [slotId, eventId],
  );
  if (slot.length === 0) throw new Error("유효하지 않은 슬롯입니다.");

  await pool.query(
    'UPDATE events SET status = "confirmed", confirmed_at = NOW() WHERE id = ?',
    [eventId],
  );

  return { message: "이벤트가 확정됐습니다.", confirmedSlot: slot[0] };
};

module.exports = { createEvent, getEvent, vote, confirmEvent };
