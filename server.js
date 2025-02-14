import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { PrismaClient } from "@prisma/client";
import nodemailer from "nodemailer";
import { z } from "zod";

dotenv.config();
const app = express();
const prisma = new PrismaClient();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

const referralSchema = z.object({
  yourName: z.string().min(2, "Your name must be at least 2 characters"),
  yourEmail: z.string().email("Invalid email format"),
  friendName: z.string().min(2, "Friend's name must be at least 2 characters"),
  friendEmail: z.string().email("Invalid email format"),
  courseName: z.string().min(3, "Course name must be at least 3 characters"),
  courseURL: z.string().url("Invalid URL format"),
});

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_PASS,
  },
});

app.post("/api/referral", async (req, res) => {
  try {
    const validationResult = referralSchema.safeParse(req.body);
    
    if (!validationResult.success) {
      return res.status(400).json({ error: validationResult.error.errors });
    }

    const {
      yourName,
      yourEmail,
      friendName,
      friendEmail,
      courseName,
      courseURL,
    } = req.body;
    
    const newReferral = await prisma.referral.create({
      data: {
        yourName,
        yourEmail,
        friendName,
        friendEmail,
        courseName,
        courseURL,
      },
    });
    
    const mailOptions = {
      from: process.env.GMAIL_USER,
      to: friendEmail,
      subject: "Course Referral Invitation",
      text: `Hi ${friendName},\n\n${yourName} has referred you to check out the course: "${courseName}"\nYou can find more details at: ${courseURL}\n\nBest Regards,\nCourse Team`,
    };
    
    await transporter.sendMail(mailOptions);

    res
      .status(201)
      .json({ message: "Referral sent successfully!", data: newReferral });
  } catch (error) {
    console.error("Error:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
