const { AttachmentBuilder } = require('discord.js');
const { registerFont, createCanvas, loadImage } = require('canvas');
const axios = require('axios');

const fs = require('node:fs');
const path = require('node:path');
const data = fs.readFileSync('players.json', 'utf8');
const players = JSON.parse(data);

async function generateImage(team_A, team_B) {
    const canvas = createCanvas(3840, 2160);
    const context = canvas.getContext('2d');

    registerFont('./fonts/big_noodle_titling.ttf', { family: 'Overwatch' });
    registerFont('./fonts/big_noodle_titling_oblique.ttf', { family: 'Overwatch_Oblique' });

    const imagePath = getRandomImagePath(path.join(__dirname, '../images/backgrounds'));
    const background = await loadImage(imagePath);

    context.drawImage(background, 0, 0, canvas.width, canvas.height);
    context.fillStyle = 'rgba(0, 0, 0, 0.5)';
    context.fillRect(0, 0, 3840, 2160)
    context.fillStyle = 'white';
    context.fillRect(128, 264, 1318, 128);
    context.fillRect(2395, 264, 1318, 128);

    context.fillStyle = 'blue';
    context.font = '45px Overwatch';
    context.textAlign = 'right';
    context.textBaseline = 'middle';
    context.fillText('TEAM 1', 1358, 328);

    context.fillStyle = 'red';
    context.font = '45px Overwatch';
    context.textAlign = 'left';
    context.textBaseline = 'middle';
    context.fillText('TEAM 2', 2425, 328);

    // Team A
    const roleOrder = ['tank', 'dps', 'support'];
    let y_val = 410;
    for(let role of roleOrder) {
        const playersInRole= team_A.get(role);

        for(let player of playersInRole) {
            const namecardImg = await getAPIimage(players[player].battletag, 'namecard');
            const avatarImg = await getAPIimage(players[player].battletag, 'avatar');
            
            context.fillStyle = 'rgb(33,33,33)';
            context.fillRect(128, 196+y_val, 980, 50);
            context.drawImage(namecardImg, 128, y_val, 981, 196);
            context.drawImage(avatarImg, 1108, y_val, 246, 246);

            context.font = '90px Overwatch_Oblique';
            context.fillStyle = 'white';
            context.textAlign = 'right';
            context.textBaseline = 'middle';

            const textY = y_val - 25 + namecardImg.height/2;

            context.fillText(players[player].battletag.split('#')[0], 1050, textY);

            y_val += 275;
        }
    }

    const buffer = canvas.toBuffer('image/png');
    return new AttachmentBuilder(buffer, { name: 'teams.png' });
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
        const response = await axios.get(`https://overfast-api.tekrop.fr/players/${formattedTag}/summary`);
        let elementURL;
        switch(element) {
            case 'namecard' : elementURL = response.data.namecard; break;
            case 'avatar' : elementURL = response.data.avatar; break
        }
        const imageResponse = await axios.get(elementURL, { responseType: 'arraybuffer'});
        const base64Image = `data:image/png;base64,${Buffer.from(imageResponse.data, 'binary').toString('base64')}`;
        return await loadImage(base64Image);
    } catch (error) {
        return loadImage(path.join(__dirname,`../images/assets/default_${element}.png`));
    }
}

module.exports = {
    generateImage
}