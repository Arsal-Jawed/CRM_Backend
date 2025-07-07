const Team = require('../Models/TeamModel');
const User = require('../Models/UserModel');

// 1. Create a Team
const createTeam = async (req, res) => {
  try {
    const { teamName, leaderId, goal } = req.body;

    const team = new Team({
      teamName,
      TeamLeader: leaderId,
      teamGoal: goal
    });

    await team.save();

    await User.findByIdAndUpdate(leaderId, { team: team.teamId });

    res.status(201).json({ message: 'Team created successfully', team });
  } catch (err) {
    res.status(500).json({ error: 'Failed to create team', details: err.message });
  }
};

// 2. Change Leader
const changeLeader = async (req, res) => {
  try {
    const { teamId } = req.params;
    const { newLeader } = req.body;
    const user = await User.findOne({ email: newLeader });
    if (!user) return res.status(404).json({ error: 'User not found' });
    const updated = await Team.findOneAndUpdate(
      { teamId },
      { TeamLeader: user._id },
      { new: true }
    );
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: 'Failed to change leader' });
  }
};

// 3. Rate Team
const rateTeam = async (req, res) => {
  try {
    const { teamId } = req.params;
    const { rating } = req.body;
    const updated = await Team.findOneAndUpdate({ teamId }, { teamRating: rating }, { new: true });
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: 'Failed to rate team' });
  }
};

// 4. Assign Goal
const assignGoal = async (req, res) => {
  try {
    const { teamId } = req.params;
    const { goal } = req.body;
    const updated = await Team.findOneAndUpdate({ teamId }, { teamGoal: goal }, { new: true });
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: 'Failed to assign goal' });
  }
};

// 5. Get all Teams
const getAllTeams = async (req, res) => {
  try {
    const teams = await Team.find();

    const enrichedTeams = await Promise.all(
      teams.map(async (team) => {
        let leader = null;

        if (team.TeamLeader) {
          leader = await User.findById(team.TeamLeader);
        }

        return {
          ...team.toObject(),
          TeamLeaderName: leader ? `${leader.firstName} ${leader.lastName}` : 'Unknown'
        };
      })
    );

    res.json(enrichedTeams);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch teams' });
  }
};

// 6. Get Team by Email (Team Leader's Email)
const getTeamByEmail = async (req, res) => {
  try {
    const { email } = req.params;

    const user = await User.findOne({ email });
    if (!user || !user.team)
      return res.status(404).json({ error: 'User not assigned to any team' });

    const team = await Team.findOne({ teamId: user.team });
    if (!team)
      return res.status(404).json({ error: 'Team not found' });

    let leader = null;
    if (team.TeamLeader) {
      leader = await User.findOne({ _id: team.TeamLeader });
    }

    const enrichedTeam = {
      ...team.toObject(),
      TeamLeaderName: leader ? `${leader.firstName} ${leader.lastName}` : 'Unknown'
    };

    res.json(enrichedTeam);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch team' });
  }
};

// 7. Assign Team to a User
const assignTeamToUser = async (req, res) => {
  try {
    const { userEmail, teamId } = req.body;
    const updated = await User.findOneAndUpdate({ email: userEmail }, { team: teamId }, { new: true });
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: 'Failed to assign team to user' });
  }
};

// 8. Update Team Info
const updateTeam = async (req, res) => {
  try {
    const { teamId } = req.params;
    const updateData = req.body;

    const updatedTeam = await Team.findOneAndUpdate(
      { teamId: teamId },
      updateData,
      { new: true }
    );

    if (!updatedTeam) {
      return res.status(404).json({ message: 'Team not found' });
    }

    res.status(200).json(updatedTeam);
  } catch (error) {
    console.error('Error updating team:', error);
    res.status(500).json({ message: 'Server error while updating team' });
  }
};

// 9. Delete a Team
const deleteTeam = async (req, res) => {
  try {
    const { teamId } = req.params;

    const team = await Team.findOneAndDelete({ teamId });

    if (!team) {
      return res.status(404).json({ error: 'Team not found' });
    }

    await User.updateMany(
      { team: teamId },
      { $unset: { team: "" } }
    );

    res.json({ message: 'Team deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete team', details: err.message });
  }
};

// 10. Remove Team Member
const removeMember = async (req, res) => {
  try {
    const { userEmail } = req.body;
    console.log(userEmail);
    const updatedUser = await User.findOneAndUpdate(
      { email: userEmail },
      { team: 0 },
      { new: true }
    );

    if (!updatedUser) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.status(200).json({ message: 'User removed from team', user: updatedUser });
  } catch (err) {
    console.error('Remove Member Error:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
};

module.exports = {
  createTeam,
  changeLeader,
  rateTeam,
  assignGoal,
  getAllTeams,
  getTeamByEmail,
  assignTeamToUser,
  updateTeam,
  deleteTeam,
  removeMember
};