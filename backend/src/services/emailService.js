const nodemailer = require('nodemailer');

/**
 * Real Email Service using Nodemailer
 */

let transporter = null;

const getTransporter = () => {
    if (!transporter) {
        transporter = nodemailer.createTransport({
            host: process.env.SMTP_HOST,
            port: process.env.SMTP_PORT,
            secure: process.env.SMTP_PORT == 465,
            auth: {
                user: process.env.SMTP_USER,
                pass: process.env.SMTP_PASS,
            },
        });
    }
    return transporter;
};

exports.sendEmail = async (to, subject, text, html) => {
    try {
        console.log(`--- Attempting to send email to ${to} ---`);

        if (!process.env.SMTP_HOST || !process.env.SMTP_USER || !process.env.SMTP_PASS) {
            console.error('❌ ERROR: SMTP Configuration is incomplete in .env!');
            console.log('Detected HOST:', process.env.SMTP_HOST);
            console.log('Detected USER:', process.env.SMTP_USER);
            return false;
        }

        const info = await getTransporter().sendMail({
            from: `"${process.env.EMAIL_FROM_NAME || 'Employee System'}" <${process.env.EMAIL_FROM_ADDRESS}>`,
            to,
            subject,
            text,
            html: html || text,
        });

        console.log('📧 Email sent: %s', info.messageId);
        return true;
    } catch (error) {
        console.error('📧 Email failed:', error);
        return false;
    }
};

exports.sendOTP = async (to, otp) => {
    const subject = `[${otp}] Kode OTP Ganti Password`;
    const text = `Kode OTP Anda untuk ganti password adalah: ${otp}. Kode ini berlaku selama 10 menit.`;
    const html = `
        <div style="font-family: sans-serif; padding: 20px; border: 1px solid #eee; border-radius: 10px; max-width: 500px;">
            <h2 style="color: #2563eb;">Atur Ulang Password</h2>
            <p>Halo,</p>
            <p>Kami menerima permintaan untuk mengatur ulang password akun Anda. Gunakan kode OTP di bawah ini untuk melanjutkan:</p>
            <div style="background: #f3f4f6; padding: 20px; border-radius: 10px; text-align: center; margin: 20px 0;">
                <span style="font-size: 32px; font-weight: bold; letter-spacing: 5px; color: #111827;">${otp}</span>
            </div>
            <p style="color: #6b7280; font-size: 14px;">Kode ini akan kedaluwarsa dalam 10 menit. Jika Anda tidak merasa melakukan permintaan ini, abaikan email ini.</p>
            <hr style="margin: 20px 0; border: none; border-top: 1px solid #eee;" />
            <p style="color: #9ca3af; font-size: 12px; text-align: center;">&copy; 2026 Employee Attendance System</p>
        </div>
    `;
    return await this.sendEmail(to, subject, text, html);
};

exports.sendWelcomeEmail = async (to, userData) => {
    const { nama_lengkap, nik, password, penempatan_store } = userData;
    const subject = `Selamat Datang di Employee Attendance System`;

    const text = `
Halo ${nama_lengkap},

Selamat bergabung dengan ${penempatan_store || 'perusahaan'} kami! 

Akun Anda telah berhasil dibuat. Berikut adalah kredensial login Anda:

NIK: ${nik}
Password: ${password}

PENTING: 
⚠️ Segera ganti password default Anda setelah login pertama kali untuk keamanan akun Anda.
⚠️ Jangan bagikan kredensial login Anda kepada siapa pun.

Silakan login ke sistem absensi menggunakan kredensial di atas.

Terima kasih,
Tim HR
    `;

    const html = `
        <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; background-color: #f8f9fa;">
            <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
                <h1 style="color: white; margin: 0; font-size: 28px;">🎉 Selamat Datang!</h1>
            </div>
            
            <div style="background: white; padding: 30px; border-radius: 0 0 10px 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
                <p style="font-size: 16px; color: #333; line-height: 1.6;">Halo <strong>${nama_lengkap}</strong>,</p>
                
                <p style="font-size: 16px; color: #333; line-height: 1.6;">
                    Selamat bergabung dengan <strong>${penempatan_store || 'perusahaan'}</strong> kami! Akun Anda telah berhasil dibuat di <strong>Employee Attendance System</strong>.
                </p>
                
                <div style="background: #f8f9fa; border-left: 4px solid #667eea; padding: 20px; margin: 25px 0; border-radius: 5px;">
                    <h3 style="color: #667eea; margin-top: 0; font-size: 18px;">📋 Kredensial Login Anda:</h3>
                    <table style="width: 100%; border-collapse: collapse;">
                        <tr>
                            <td style="padding: 10px 0; font-weight: bold; color: #555; width: 100px;">NIK:</td>
                            <td style="padding: 10px 15px; background: white; border-radius: 5px; font-family: 'Courier New', monospace; font-size: 16px; color: #111; font-weight: bold;">${nik}</td>
                        </tr>
                        <tr><td colspan="2" style="height: 10px;"></td></tr>
                        <tr>
                            <td style="padding: 10px 0; font-weight: bold; color: #555;">Password:</td>
                            <td style="padding: 10px 15px; background: white; border-radius: 5px; font-family: 'Courier New', monospace; font-size: 16px; color: #111; font-weight: bold;">${password}</td>
                        </tr>
                    </table>
                </div>
                
                <div style="background: #fff3cd; border-left: 4px solid #ffc107; padding: 20px; margin: 25px 0; border-radius: 5px;">
                    <h3 style="color: #856404; margin-top: 0; font-size: 16px;">⚠️ PENTING - Harap Diperhatikan:</h3>
                    <ul style="color: #856404; margin: 10px 0; padding-left: 20px; line-height: 1.8;">
                        <li><strong>Segera ganti password default Anda</strong> setelah login pertama kali untuk keamanan akun Anda.</li>
                        <li><strong>Jangan bagikan</strong> kredensial login Anda kepada siapa pun.</li>
                        <li>Jika Anda mengalami masalah saat login, silakan hubungi Tim HR.</li>
                    </ul>
                </div>
                
                <div style="text-align: center; margin: 30px 0;">
                    <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}" 
                       style="display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 15px 40px; text-decoration: none; border-radius: 25px; font-weight: bold; font-size: 16px; box-shadow: 0 4px 15px rgba(102, 126, 234, 0.4);">
                        🚀 Login Sekarang
                    </a>
                </div>
                
                <hr style="margin: 30px 0; border: none; border-top: 1px solid #eee;" />
                
                <p style="color: #6c757d; font-size: 14px; line-height: 1.6;">
                    Jika Anda memiliki pertanyaan atau memerlukan bantuan, jangan ragu untuk menghubungi Tim HR kami.
                </p>
                
                <p style="color: #6c757d; font-size: 14px; margin-top: 20px;">
                    Salam hangat,<br/>
                    <strong>Tim HR</strong>
                </p>
            </div>
            
            <div style="text-align: center; padding: 20px; color: #9ca3af; font-size: 12px;">
                <p style="margin: 5px 0;">&copy; 2026 Employee Attendance System</p>
                <p style="margin: 5px 0;">Email ini dikirim secara otomatis, mohon tidak membalas email ini.</p>
            </div>
        </div>
    `;

    return await this.sendEmail(to, subject, text, html);
};
