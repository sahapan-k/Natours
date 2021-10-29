const nodemailer = require('nodemailer');
const pug = require('pug');
const { htmlToText } = require('html-to-text');

module.exports = class Email {
  constructor(user, url) {
    this.to = user.email;
    this.firstName = user.name.split(' ')[0];
    this.url = url;
    this.from = `Jonas Schmedtmann <${process.env.EMAIL_FROM}>`;
  }

  newTransport() {
    if (process.env.NODE_ENV === 'production') {
      // SendGrid Transporter (PLACEHOLDER SINCE SENDGRID LIMIT NEW USER)
      //   return nodemailer.createTransport({
      //     service: 'SendGrid',
      //     auth: {
      //       user: process.env.SENDGRID_USERNAME,
      //       pass: process.env.SENDGRID_PASSWORD,
      //     },
      //   });
      return;
    }
    return nodemailer.createTransport({
      host: process.env.EMAIL_HOST,
      port: process.env.EMAIL_PORT,
      auth: {
        user: process.env.EMAIL_USERNAME,
        pass: process.env.EMAIL_PASSWORD,
      },
    });
  }

  async send(template, subject) {
    // Render HTML based on PUG Template
    const html = pug.renderFile(`${__dirname}/../view/email/${template}.pug`, {
      firstName: this.firstName,
      url: this.url,
      subject,
    });
    // Define Email option
    const emailOption = {
      from: this.from,
      to: this.to,
      subject,
      html,
      text: htmlToText(html),
      // html option
    };

    // create Transport and send email
    await this.newTransport().sendMail(emailOption);
  }

  async sendWelcome() {
    await this.send('welcome', 'Welcome to the Natours Family!');
  }

  async sendPasswordReset() {
    await this.send(
      'passwordReset',
      'Your password reset token (valid for only 10 minutes!)'
    );
  }
};
