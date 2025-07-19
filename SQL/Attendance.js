const db = require('../db');

const createAttendanceTable = () => {

    const query = `
      create table if not exists attendance(
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_email VARCHAR(255),
        date DATE,
        status ENUM('Present', 'Absent', 'Leave', 'Late') DEFAULT 'Present',
        check_in_time TIME,
        check_out_time TIME,
        remarks TEXT
      )`;

      db.query(query, (err,result) => {
            if(err) throw err;
            console.log("Attendance Data Connected");
      });
};

module.exports = {createAttendanceTable};