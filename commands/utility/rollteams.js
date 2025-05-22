const { SlashCommandBuilder } = require('discord.js');
const { generateImage } = require('../../helpers/canvasHelper');

const fs = require('node:fs');
const data = fs.readFileSync('players.json', 'utf8');
const players = JSON.parse(data);

module.exports = {
    data: new SlashCommandBuilder()
        .setName('rollteams')
        .setDescription('Randomly creates balanced teams based on players\' preferred roles.'),

    async execute(interaction) {
        await interaction.deferReply();

        const requiredRoles = {
            tank: 2,
            dps: 4,
            support: 4
        };

        const rolePlayers = new Map();

        // Build both maps
        for (let player in players) {
            const roles = players[player].roles;

            for (let role of roles) {
                if (!rolePlayers.has(role)) {
                    rolePlayers.set(role, new Set());
                }
                rolePlayers.get(role).add(player);
            }
        }

        // Verify there are enough roles for each team
        for (let role in rolePlayers.keys()) {
            if (rolePlayers.get(role).size !== requiredRoles[role]) {
                await interaction.reply(`❌ Not enough ${role.charAt(0).toUpperCase + role.slice(1)}`);
                return;
            }
        }

        // Brute force team generation
        let team_A;
        let team_B;

        do {
            const rolePlayersCopy = new Map();
            for (const [key, value] of rolePlayers) {
                rolePlayersCopy.set(key, new Set(value));
            }

            team_A = generateTeams(rolePlayersCopy);
            team_B = generateTeams(rolePlayersCopy);

        } while (!isValidTeam(team_A, requiredRoles) || !isValidTeam(team_B, requiredRoles))

        console.log('TEAM A');
        console.log(team_A);
        console.log()
        console.log('TEAM B');
        console.log(team_B);
        console.log()

        const imageAttachment = await generateImage(team_A, team_B);
        await interaction.editReply({ files : [imageAttachment] });
    },
};

/**
 * Creates a map of an Overwatch team.
 *
 * @param {Map<string, string[]>} rolePlayers Map of each role and the possible players to choose from.
 * @returns {Map<string, string[]>} A map of assigned roles to players for the team.
 */
function generateTeams(rolePlayers) {
    const team = new Map();

    fillRole('tank', team, rolePlayers);
    fillRole('dps', team, rolePlayers);
    fillRole('dps', team, rolePlayers);
    fillRole('support', team, rolePlayers);
    fillRole('support', team, rolePlayers);

    return team;
}

/**
 * Fills a specific role with possible players.
 *
 * @param {string} role The name of the role to fill (e.g., "tank").
 * @param {Map<string, string[]>} team The current team, with roles as keys and arrays of players as values.
 * @param {Map<string, string[]>} rolePlayers Map of each role and the possible players to choose from.
 * @returns {void}
 */
function fillRole(role, team, rolePlayers) {
    // Pick random player in role to add to the team 
    const playerArr = Array.from(rolePlayers.get(role));
    const chosenPlayer = playerArr[Math.floor(Math.random() * playerArr.length)];

    if (!team.has(role)) {
        team.set(role, new Set());
    }
    team.get(role).add(chosenPlayer);

    // Remove that player from every other role to avoid duplicate picks
    for (const roleSet of rolePlayers.values()) {
        roleSet.delete(chosenPlayer);
    }
}

/**
 * Makes sure team each team is a valid team
 * 
 * @param {Map<string, string[]} team A map of assigned roles to players for the team.
 * @returns {boolean} true if team has right number of players and no undefined values, false otherwise.
 */
function isValidTeam(team, requiredRoles) {
    for(const role of team.keys()) {
        if(team.get(role).has(undefined)) {
            return false;
        }
        
        if(team.get(role).size !== requiredRoles[role]/2) {
            return false;
        }
    }

    return true;
}