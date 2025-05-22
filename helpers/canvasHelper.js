const { AttachmentBuilder } = require('discord.js');
const Canvas = require('@napi-rs/canvas');
const axios = require('axios');

const fs = require('node:fs');
const path = require('node:path');
const data = fs.readFileSync('players.json', 'utf8');
const players = JSON.parse(data);

async function generateImage(team_A, team_B) {
    const canvas = Canvas.createCanvas(3840, 2160);
    const context = canvas.getContext('2d');

    const imagePath = getRandomImagePath(path.join(__dirname, '../images/backgrounds'));
    const background = await Canvas.loadImage(imagePath);

    context.drawImage(background, 0, 0, canvas.width, canvas.height);
    context.fillStyle = 'white';
    context.fillRect(128, 264, 1318, 128);
    context.fillRect(2395, 264, 1318, 128);

    // Team A
    const roleOrder = ['tank', 'dps', 'support'];
    let y_val = 410;
    for(let role of roleOrder) {
        const playersInRole= team_A.get(role);

        for(let player of playersInRole) {
            const namecardImg = getAPIimage(players[player].battletag, 'namecard');
            const avatarImg = getAPIimage(players[player].battletag, 'avatar');

            context.drawImage(namecardImg, 128, y_val, 981, 196);
            context.drawImage(avatarImg, 980, y_val, 246, 246);
            y_val += 275;
        }
    }

    return new AttachmentBuilder(await canvas.encode('png'), { name: 'teams.png' });
}

/**
 * Picks a random image file from a folder
 * @param {string} folderPath Path to the image folder
 * @returns {string} Full path to the selected image
 */
function getRandomImagePath(folderPath) {
    const files = fs.readdirSync(folderPath)
        .filter(file => /\.(jpg|jpeg|png|gif)$/i.test(file));
    
    const randomIndex = Math.floor(Math.random() * files.length);
    return path.join(folderPath, files[randomIndex]);
}

async function getAPIimage(battleTag, element) {
    try {
        const formattedTag = battleTag.replace('#', '-');
        console.log(formattedTag);
        const response = await axios.get(`https://overfast-api.tekrop.fr/${formattedTag}/summary`);
        let elementURL;
        switch(element) {
            case 'namecard' : elementURL = response.data.namecard; break;
            case 'avatar' : elementURL = response.data.avatar; break
        }
        const imageResposne = await axios.get(elementURL, { responseType: 'arraybuffer'});
        const imageBuffer = Buffer.from(imageResposne.data, 'binary');
        return await Canvas.loadImage(imageBuffer);
    } catch (error) {
        console.error('Error fetching namecard for' + battleTag);
        return null;
    }
}
module.exports = {
    generateImage
}