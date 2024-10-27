const express = require("express");
const path = require("path");
const fs = require("fs");
const xlsx = require("xlsx");

const app = express();
const PORT = 3000;

let randomCode = "";   // Holds the generated code for students to log in
let isLocked = false;  // Determines if login is allowed
const students = [
    "RASOOL M", "RATHISH P N", "RAVIKUMAR R", "REETHU NIVYAA V",
    "RISHI M S", "RITESH M S", "ROHAN KUMAR E", "ROHIT R", 
    "SABARINATHAN M", "SAGAR M", "SAHANNA B", "SAI VISHAL L N",
    "SAILESH S", "SAINDHAVI S", "SAJEEV MRITHUL S", "SAM MESHAK P", 
    "SAMYUKTHA J", "SANDHIYA L", "SANJANA B", "SANJAY J", "SANJAY M",
    "SANJAY N", "SANJEEV G", "SANJEEV Y", "SANTHOSH P", "SANTHOSH R",
    "SANTHOSH KUMAR S", "SANTHOSH PANDI M", "SARAN NITHISH S", "SARIKA V",
    "SARUMATHI", "SARVESH D", "SEENUVASAN", "SHAANA ZAIMA S", "SHAILAJAA J",
    "SHALINI G", "SHALINI SHAHANI C", "SHAMEENA M", "SHANDIYA S", "SHANJITHKRISHNA V",
    "SHANKAR POOJA", "SHANMUGA KRISHNAN S M", "SHAMUGANATHAN S S", "SHARIKAA D",
    "SHERIN FAURGANA S", "SHESHANK A", "SHIVANI S", "SHOBANA S", "SHREENANDH L S",
    "SHRINIDHI MEENA PALANIAPPAN", "SHRIYA R", "SHRUTHI S S", "SHYAM FRANCIS T", "SHYLENDHAR M",
    "SIDDHARTHA MARIAPPAN S", "SIDHARTH P L", "SINDHUJA M", "SIVAGURUNATHAN P",
    "SOFIA M", "SORNESHVARAN D R"
    // Include all students
];

app.use(express.json());
app.use(express.static("public")); // Serves static files from the 'public' folder

const ADMIN_PASSWORD = "admin";  // Set your desired password here

// Route to serve the Admin Page with password protection
app.get("/admin", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "admin.html"));
});

app.get("/student", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "student.html"));
});

// Route to provide the student list
app.get("/student/names", (req, res) => {
  res.json({ names: students });
});

// Generate a Random 4-digit Code and Enable Student Login
app.post("/admin/generate-code", (req, res) => {
  randomCode = Math.floor(1000 + Math.random() * 9000).toString(); // Generate a random 4-digit code
  isLocked = false;  // Unlock login when a new code is generated
  res.json({ code: randomCode });
});

// Lock or Unlock Student Access
app.post("/admin/lock-unlock", (req, res) => {
  isLocked = req.body.lock;  // Lock or unlock based on admin's choice
  res.json({ message: isLocked ? "System is locked" : "System is unlocked" });
});

// Student Login and Attendance Marking
app.post("/student/login", (req, res) => {
  const { code, studentName } = req.body;

  if (isLocked) {
    return res.status(403).json({ message: "Login is locked" }); // Return error if locked
  }
  if (code === randomCode && students.includes(studentName)) {
    logAttendance(studentName);
    res.json({ message: "Attendance recorded" });
  } else {
    res.status(401).json({ message: "Invalid code or student name" });
  }
});

// Reset Attendance Data
app.post("/admin/reset-attendance", (req, res) => {
  const filePath = path.join(__dirname, "data", "attendance.xlsx");

  if (fs.existsSync(filePath)) {
    fs.unlinkSync(filePath);  // Delete the attendance file
    res.json({ message: "Attendance data reset successfully" });
  } else {
    res.status(404).json({ message: "No attendance data found" });
  }
});

// Function to Log Attendance into Excel
function logAttendance(studentName) {
  const filePath = path.join(__dirname, "data", "attendance.xlsx");

  let workbook;
  let worksheet;

  // If the file exists, load it; otherwise, create a new workbook
  if (fs.existsSync(filePath)) {
    // Read existing file
    workbook = xlsx.readFile(filePath);
    worksheet = workbook.Sheets["Attendance"];
  } else {
    // Create new workbook and worksheet with headers
    workbook = xlsx.utils.book_new();
    worksheet = xlsx.utils.aoa_to_sheet([["Student Name", "Date"]]); // Initialize with header row
    xlsx.utils.book_append_sheet(workbook, worksheet, "Attendance");  // Append worksheet to workbook
  }

  // Add the student's attendance record as a new row
  const date = new Date().toLocaleString();
  xlsx.utils.sheet_add_aoa(worksheet, [[studentName, date]], { origin: -1 });

  // Ensure "Attendance" sheet is added to the workbook
  workbook.Sheets["Attendance"] = worksheet;

  // Write the updated workbook to the file
  xlsx.writeFile(workbook, filePath);
}

// Route for Admin to Download Attendance Log
app.get("/admin/download-attendance", (req, res) => {
  const filePath = path.join(__dirname, "data", "attendance.xlsx");
  if (fs.existsSync(filePath)) {
    res.download(filePath);
  } else {
    res.status(404).send("Attendance log not found");
  }
});

// Start the Server
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
