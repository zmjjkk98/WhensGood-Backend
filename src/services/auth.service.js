const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const pool = require("../config/db");

const generateTokens = (id, email) => {
  const accessToken = jwt.sign({ id, email }, process.env.JWT_ACCESS_SECRET, {
    expiresIn: process.env.JWT_ACCESS_EXPIRES || "15m",
  });
  const refreshToken = jwt.sign({ id, email }, process.env.JWT_REFRESH_SECRET, {
    expiresIn: process.env.JWT_REFRESH_EXPIRES || "7d",
  });
  return { accessToken, refreshToken };
};

const register = async ({ email, password, nickname }) => {
  const [existing] = await pool.query("SELECT id FROM users WHERE email = ?", [
    email,
  ]);
  if (existing.length > 0) throw new Error("이미 사용 중인 이메일입니다.");

  const hashed = await bcrypt.hash(password, 10);
  const [result] = await pool.query(
    "INSERT INTO users (email, password, nickname) VALUES (?, ?, ?)",
    [email, hashed, nickname],
  );

  const tokens = generateTokens(result.insertId, email);
  return { user: { id: result.insertId, email, nickname }, ...tokens };
};

const login = async ({ email, password }) => {
  const [rows] = await pool.query("SELECT * FROM users WHERE email = ?", [
    email,
  ]);
  if (rows.length === 0)
    throw new Error("이메일 또는 비밀번호가 올바르지 않습니다.");

  const user = rows[0];
  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) throw new Error("이메일 또는 비밀번호가 올바르지 않습니다.");

  const tokens = generateTokens(user.id, user.email);
  return {
    user: { id: user.id, email: user.email, nickname: user.nickname },
    ...tokens,
  };
};

const refresh = (token) => {
  const payload = jwt.verify(token, process.env.JWT_REFRESH_SECRET);
  const accessToken = jwt.sign(
    { id: payload.id, email: payload.email },
    process.env.JWT_ACCESS_SECRET,
    { expiresIn: "15m" },
  );
  return { accessToken };
};

module.exports = { register, login, refresh };
