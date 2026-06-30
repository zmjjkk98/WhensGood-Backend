const transporter = require("../config/mailer");

const sendConfirmation = async ({ to, title, startTime, endTime }) => {
  await transporter.sendMail({
    from: `"WhensGood" <${process.env.MAIL_USER}>`,
    to,
    subject: `[WhensGood] "${title}" 일정이 확정됐어요!`,
    html: `
      <h2>📅 일정이 확정됐습니다!</h2>
      <p><strong>${title}</strong> 일정이 아래와 같이 확정됐어요.</p>
      <ul>
        <li>시작: ${new Date(startTime).toLocaleString("ko-KR")}</li>
        <li>종료: ${new Date(endTime).toLocaleString("ko-KR")}</li>
      </ul>
      <p>참석 부탁드려요 😊</p>
    `,
  });
};

module.exports = { sendConfirmation };
