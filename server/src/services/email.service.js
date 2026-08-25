import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

class EmailService {
    async sendVerificationEmail(email, rawToken) {
        const verificationUrl = `${process.env.FRONTEND_URL}/verify-email?token=${rawToken}`;

        try {
            const result = await resend.emails.send({
                from: process.env.EMAIL_FROM,
                to: email,
                subject: "Verify your APIShield email",
                html: `
                    <h2>Verify your email</h2>
                    <p>
                        Please verify your email address
                        to activate your APIShield account.
                    </p>
                    <a href="${verificationUrl}">
                        Verify Email
                    </a>
                    <p>
                        This link expires in 30 minutes.
                    </p>
                `
            });

            console.log("=== RESEND EMAIL RESULT ===");
            console.log("Recipient:", email);
            console.log("Data:", result.data);
            console.log("Error:", result.error);
            console.log("===========================");

            return result;
        } catch (error) {
            console.error("=== RESEND EMAIL EXCEPTION ===");
            console.error(error);
            console.error("==============================");

            throw error;
        }
    }
}

const emailService = new EmailService();

export default emailService;