const db = require('../db');

const createNotificationTable = () => {

    const query = `
       create table if not exists notification(
         notifier varchar(200) not null,
         detail varchar(500) not null,
         date DATETIME NOT NULL
       )
    `;

    db.query(query, (err,result) => {
        if(err) throw err;
        console.log("Notifications Data Connected");
    });
};

module.exports = {createNotificationTable};