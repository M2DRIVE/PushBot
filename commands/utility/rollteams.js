const { SlashCommandBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const { generateImage } = require('../../helpers/canvasHelper');

const fs = require('node:fs');
const data = fs.readFileSync('players.json', 'utf8');
const players = JSON.parse(data);

const spectatorPresent = true;

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

        // Pick Spectator
        const playerMap = new Map(Object.entries(players));
        let activePlayers = playerMap;
        let spectator = undefined;
        if (spectatorPresent) {
            const safeSpectators = getSafeSpectators(playerMap, requiredRoles);
            // Unlikely scenario with good team role queues
            if (safeSpectators.length === 0) {
                await interaction.reply('❌ No valid spectator could be chosen without breaking team roles.');
                return;
            }
            spectator = safeSpectators[Math.floor(Math.random() * safeSpectators.length)];
            activePlayers = new Map([...playerMap].filter(([key, value]) => key !== spectator));
        }

        // Build rolePlayers
        const rolePlayers = new Map();

        for (let player of activePlayers.keys()) {
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
        console.log('SPECTATOR: ' + spectator);

        const imageAttachment = await generateImage(team_A, team_B, spectator);
        const row = getButtons();
        await interaction.editReply({ files: [imageAttachment], components: [row] });
    },
};

/**
 * Returns a list of player names who, if removed, will not create vacancy slots for any required role
 * 
 * @param {*} playerMap Map of players.json containing all players
 * @param {*} requiredRoles number of players needed per role
 * @returns The names of safe to spectate players
 */
function getSafeSpectators(playerMap, requiredRoles) {
    const safeSpectators = [];

    const playerNames = Object.keys(players);

    for (const candidate of playerNames) {
        // Simulate removing this player
        const active = playerNames.filter(p => p !== candidate);
        const roles = new Map();

        for (const player of active) {
            for (const role of playerMap.get(player).roles) {
                if (!roles.has(role)) roles.set(role, []);
                roles.get(role).push(player);
            }
        }

        // Check if enough players for each role
        let isSafe = true;
        for (const [role, required] of Object.entries(requiredRoles)) {
            if ((roles.get(role) || []).length < required) {
                isSafe = false;
                break;
            }
        }

        // Player is safe to spectate, add to list
        if (isSafe) {
            safeSpectators.push(candidate);
        }
    }

    return safeSpectators;
}

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
    for (const role of team.keys()) {
        if (team.get(role).has(undefined)) {
            return false;
        }

        if (team.get(role).size !== requiredRoles[role] / 2) {
            return false;
        }
    }

    return true;
}

/**
 * Creates the interaction buttons and returns the ActionRowBuilder with those buttons
 * 
 * @returns { ActionRowBuilder } row with buttons
 */
function getButtons() {
    const splitvc = new ButtonBuilder()
        .setCustomId('splitvc')
        .setLabel('🔊 Split VC')
        .setStyle(ButtonStyle.Primary);

    const reroll = new ButtonBuilder()
        .setCustomId('reroll')
        .setLabel('🔁 Re-roll')
        .setStyle(ButtonStyle.Secondary);

    const row = new ActionRowBuilder()
        .addComponents(splitvc, reroll);

    return row;
}