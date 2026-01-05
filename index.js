const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const http = require("http");
const connectDB = require('./config.js');
const dotenv = require('dotenv');
dotenv.config();

process.on("uncaughtException", (err) => {
  console.error("Uncaught Exception:", err);
});

process.on("unhandledRejection", (err) => {
  console.error("Unhandled Rejection:", err);
});

const userRoutes = require('./Routes/UserRouter.js');
const leadRoutes = require('./Routes/LeadRouter.js');
const notificationRoutes = require('./Routes/NotificationRouter.js');
const scheduleRoutes = require('./Routes/ScheduleRouter.js');
const teamRoutes = require('./Routes/TeamRouter.js');
const callRoutes = require('./Routes/CallRouter.js');
const docRoutes = require('./Routes/DocRouter.js');
const remarkRoutes = require('./Routes/RemarkRouter.js');
const messageRoutes = require('./Routes/MessageRouter.js');
const saleRoutes = require('./Routes/SaleRouter.js');
const ticketRoutes = require('./Routes/TicketRouter.js');
const equipmentRoutes = require('./Routes/EquipmentRouter.js');
const dataRoutes = require('./Routes/DataRouter.js');
const attendanceRoutes = require('./Routes/AttendanceRouter.js');
const recordRouter = require('./Routes/RecordRouter.js');

require('./Modules/Cron.js');

const app = express();
const PORT = process.env.PORT;

app.use(bodyParser.json());
app.use(cors());
const server = http.createServer(app);

app.use('/users',userRoutes);
app.use('/leads',leadRoutes);
app.use('/notifications',notificationRoutes);
app.use('/schedules',scheduleRoutes);
app.use('/teams',teamRoutes);
app.use('/calls',callRoutes);
app.use('/docs',docRoutes);
app.use('/remarks',remarkRoutes);
app.use('/messages',messageRoutes);
app.use('/sales',saleRoutes);
app.use('/tickets',ticketRoutes);
app.use('/equipments',equipmentRoutes);
app.use('/data',dataRoutes);
app.use('/attendance',attendanceRoutes);
app.use('/records',recordRouter);
  
connectDB();

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));