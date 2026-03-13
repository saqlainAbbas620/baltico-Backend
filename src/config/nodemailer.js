import nodemailer from "nodemailer";
import { email, emailPass } from "../constants.js";

let _transporter = null;


function getTransporter(){
    if(_transporter) return _transporter;

    const user = email?.trim();
    const pass = emailPass?.trim();
    if(!user || !pass) {
        console.warn("Email credentials are not set. Email functionality will be disabled.");
        return null;
    }   
    _transporter = nodemailer.createTransport({
        service: "gmail",
        auth: {user, pass}
    });
    return _transporter;
}

export const sendEmail = async (to, subject, html) => {
    const transporter = getTransporter();
    if(!transporter) {
        console.warn("Email transporter is not configured. Cannot send email.");
        return;
    }
    try {
        await transporter.sendMail({
            from: `"BaltiCo" <${email?.trim()}>`,
            to,
            subject,
            html
        });
        console.log(`Email sent to ${to}`);
        
    } catch (error) {
        console.error("Error sending email:", error);
    }   
}