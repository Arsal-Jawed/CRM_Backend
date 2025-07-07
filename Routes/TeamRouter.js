const express = require('express');
const router = express.Router();
const teamController = require('../Controllers/TeamController');

router.post('/createTeam', teamController.createTeam);
router.put('/changeLeader/:teamId', teamController.changeLeader);
router.put('/rateTeam/:teamId', teamController.rateTeam);
router.put('/assignGoal/:teamId', teamController.assignGoal);
router.get('/getAllTeams', teamController.getAllTeams);
router.get('/getTeamByEmail/:email', teamController.getTeamByEmail);
router.put('/assignTeam', teamController.assignTeamToUser);
router.delete('/delete/:teamId', teamController.deleteTeam);
router.put('/updateTeam/:teamId', teamController.updateTeam);
router.put('/removeMember', teamController.removeMember);

module.exports = router;