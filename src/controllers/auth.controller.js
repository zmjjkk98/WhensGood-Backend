const authService = require("../services/auth.service");

const register = async (req, res) => {
  try {
    const { email, password, nickname } = req.body;
    if (!email || !password || !nickname)
      return res.status(400).json({ message: "모든 필드를 입력해주세요." });

    const result = await authService.register({ email, password, nickname });
    res.status(201).json(result);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password)
      return res
        .status(400)
        .json({ message: "이메일과 비밀번호를 입력해주세요." });

    const result = await authService.login({ email, password });
    res.status(200).json(result);
  } catch (err) {
    res.status(401).json({ message: err.message });
  }
};

const refresh = (req, res) => {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken)
      return res.status(400).json({ message: "refreshToken이 없습니다." });

    const result = authService.refresh(refreshToken);
    res.status(200).json(result);
  } catch {
    res.status(401).json({ message: "유효하지 않은 refreshToken입니다." });
  }
};

module.exports = { register, login, refresh };
