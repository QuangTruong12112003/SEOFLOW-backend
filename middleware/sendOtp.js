const nodemailer = require("nodemailer");
const JWTHandler = require("./JWTHandler");
require("dotenv").config();

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

const sendOtpEmail = async (email, otp) => {
  const index = email.indexOf("@");
  const name = email.substring(0, index);
  const mailOptions = {
    from: `"SOCIAL SEO" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: "Mã xác minh tài khoản của bạn",
    html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; border: 1px solid #eee; border-radius: 8px; padding: 20px;">
            <hr />
            <h2 style="color: #333;">Bạn đã sắp hoàn thành rồi!</h2>
            <p>Xin chào <strong>${name}</strong>,</p>
            <p>Mã xác minh của bạn là:</p>
            <div style="font-size: 28px; font-weight: bold; letter-spacing: 6px; margin: 20px 0; text-align: center;">${otp}</div>
            <p>Nhập mã xác minh này để tiếp tục thiết lập tài khoản. Mã này sẽ hết hạn sau <strong>10 phút</strong>.</p>
            <p style="color: gray;">Nếu bạn không yêu cầu mã này, hãy bỏ qua email này.</p>
            <hr />
            <p style="font-size: 12px; color: #aaa; text-align: center;">Đây là tin nhắn tự động từ hệ thống SOCIAL SEO</p>
          </div>
        `,
  };
  await transporter.sendMail(mailOptions);
};

const sendChangePass = async (email) => {
  const hanldJWT = new JWTHandler();
  const token = hanldJWT.generateToken(email, 1800);
  const link = `${process.env.CLIENT_URL}reset-password?token=${token}`;
  const mailOptions = {
    from: `"SOCIAL SEO" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: "Đặt lại mật khẩu mới",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; border: 1px solid #eee; border-radius: 8px; padding: 20px;">
        <hr />
        <p>Xin chào</p>
        <p>Chúng tôi đã nhận được yêu cầu đặt mật khẩu mới cho tài khoản này:</p>
        <p style="color: black" ><strong>${email}</strong></p>
        <a href="${link}" 
        style="
        display: inline-block;
        background-color: #007bff;
        color: white;
        padding: 10px 20px;
        border-radius: 6px;
        text-decoration: none;
        font-weight: bold;
        font-size: 14px;
        text-align: center;
        transition: background-color 0.3s ease;">
        Đặt lại mật khẩu
        </a>
        <p style="color: gray;">Nếu bạn không yêu cầu, hãy bỏ qua email này.</p>
        <hr />
        <p style="font-size: 12px; color: #aaa; text-align: center;">Đây là tin nhắn tự động từ hệ thống SOCIAL SEO</p>
      </div>
    `,
  };
  await transporter.sendMail(mailOptions);
};

const senmdEmailVerifyAccouns = async (email, projectId, projectName) => {
  const link = `${process.env.CLIENT_URL}verifyAccount/${email}?projectId=${projectId}/dashboard`;
  const mailOptions = {
    from: `"SOCIAL SEO" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: "Thư mời tham gia dự án",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; border: 1px solid #eee; border-radius: 8px; padding: 20px;">
        <hr />
        <p>Xin chào</p>
        <p>Bạn có một thư mời tham gia dự án ${projectName}</p>
        <p style="color: black" ><strong>${email}</strong></p>
        <a href="${link}" 
        style="
        display: inline-block;
        background-color: #007bff;
        color: white;
        padding: 10px 20px;
        border-radius: 6px;
        text-decoration: none;
        font-weight: bold;
        font-size: 14px;
        text-align: center;
        transition: background-color 0.3s ease;">
        Truy cập dự án
        </a>
        <p style="color: gray;">Nếu bạn không tham gia, hãy bỏ qua email này.</p>
        <hr />
        <p style="font-size: 12px; color: #aaa; text-align: center;">Đây là tin nhắn tự động từ hệ thống SOCIAL SEO</p>
      </div>
    `,
  };
  await transporter.sendMail(mailOptions);
};

const sendMailNotification = async (email, content, projectName, link) => {
  const mailOptions = {
    from: `"SOCIAL SEO" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: `Thông báo từ dự án ${projectName}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; border: 1px solid #eee; border-radius: 8px; padding: 20px;">
        <hr />
        <p>Xin chào</p>
        <p>${content}</p>
        <a href="${link}" 
        style="
        display: inline-block;
        background-color: #007bff;
        color: white;
        padding: 10px 20px;
        border-radius: 6px;
        text-decoration: none;
        font-weight: bold;
        font-size: 14px;
        text-align: center;
        transition: background-color 0.3s ease;">
        Truy cập dự án để xem chi tiết
        </a>
        <p style="color: gray;">Nếu bạn không tham gia, hãy bỏ qua email này.</p>
        <hr />
        <p style="font-size: 12px; color: #aaa; text-align: center;">Đây là tin nhắn tự động từ hệ thống SOCIAL SEO</p>
      </div>
    `,
  };
  await transporter.sendMail(mailOptions);
};
module.exports = { sendOtpEmail, sendChangePass, senmdEmailVerifyAccouns, sendMailNotification };
