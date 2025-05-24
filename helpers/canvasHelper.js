const { AttachmentBuilder } = require('discord.js');
const { registerFont, createCanvas, loadImage, Image } = require('canvas');
const axios = require('axios');

const fs = require('node:fs');
const path = require('node:path');
const data = fs.readFileSync('players.json', 'utf8');
const players = JSON.parse(data);

async function generateImage(team_A, team_B) {
    const canvas = createCanvas(3840, 2160);
    const context = canvas.getContext('2d');

    registerFont('./fonts/big_noodle_titling_oblique.ttf', { family: 'Overwatch_Oblique' });
    const roleOrder = ['tank', 'dps', 'support'];
    const radius = 20;

    // Background
    // const imagePath = getRandomImagePath(path.join(__dirname, '../images/backgrounds'));
    // const background = await loadImage(imagePath);
    const map = await getRandomMap();
    const imageResponse = await axios.get(map.screenshot, { responseType: 'arraybuffer' });
    const base64Image = `data:image/png;base64,${Buffer.from(imageResponse.data, 'binary').toString('base64')}`;
    const background = await loadImage(base64Image);
    context.drawImage(background, 0, 0, canvas.width, canvas.height);
    context.fillStyle = 'rgba(0, 0, 0, 0.6)';
    context.fillRect(0, 0, 3840, 2160)

    // Map Data
    context.textAlign = 'right';
    context.textBaseline = 'top';
    context.font = 'bold italic 60px Overwatch_Oblique';
    context.fillStyle = 'rgb(237, 101, 22)';
    const gamemode = map.gamemodes[0];
    context.fillText(gamemode, 3436, 1859);
    context.font = 'bold italic 155px Overwatch_Oblique';
    context.fillStyle = 'white';
    context.fillText(map.name, 3411, 1923 - 25);
    const textWidth = context.measureText(map.name).width;
    const flag_img = await getFlagImg(map.country_code);
    context.drawImage(flag_img, 3411 - textWidth - flag_img.width - 65, 1940, 118, 118);

    // Overwatch Logo
    const logo = await loadImage('./images/assets/logo.png');
    context.drawImage(logo, 3488, 1856, 188, 188);

    // VS Text
    context.fillStyle = 'white';
    context.textAlign = 'center';
    context.textBaseline = 'middle';
    context.font = 'bold italic 250px Overwatch_Oblique'
    context.fillText('VS', canvas.width / 2, canvas.height / 2);

    // Team A

    // Team Card
    roundRectPath(context, 128, 264, 1318, 118, radius, { tl: true, tr: true, br: true, bl: true });
    context.fillStyle = 'white';
    context.fill();

    // Team Text
    const team1Img = await loadImage('./images/assets/team1.png');
    context.drawImage(team1Img, 1135, 304, 210, 35);

    let y_val = 410;
    for (let role of roleOrder) {
        const playersInRole = team_A.get(role);

        for (let player of playersInRole) {

            // Player Avatar
            const avatarImg = await getAPIimage(players[player].battletag, 'avatar');
            context.drawImage(avatarImg, 1108, y_val, 246, 246);

            // Player Namecard
            const namecardImg = await getAPIimage(players[player].battletag, 'namecard');
            roundRectPath(context, 128, y_val, 981, 196, radius, { tl: true, tr: false, br: false, bl: false });
            context.save();
            context.clip();
            context.drawImage(namecardImg, 128, y_val, 981, 196);
            context.restore();

            const gradient = context.createLinearGradient(128, y_val, 128 + 981, y_val);
            const steps = 20;
            for (let i = 0; i <= steps; i++) {
                const t = i / steps;
                const alpha = Math.pow(t, 3);
                gradient.addColorStop(t, `rgba(0, 0, 0, ${alpha * 0.4})`);
            }

            roundRectPath(context, 128, y_val, 981, 196, radius, { tl: true, tr: false, br: false, bl: false });
            context.fillStyle = gradient;
            context.fill();

            // Player Name
            context.font = 'bold italic 130px Overwatch_Oblique';
            context.fillStyle = 'white';
            context.textAlign = 'right';
            context.textBaseline = 'middle';
            const textY = y_val - 25 + namecardImg.height / 2;
            context.fillText(players[player].battletag.split('#')[0], 1050, textY);

            // Player Role Card 
            roundRectPath(context, 128, 196 + y_val, 980, 51, radius, { tl: false, tr: false, br: false, bl: true });
            context.fillStyle = 'rgb(33,33,33)';
            context.fill();
            context.fillStyle = 'white';
            context.font = 'bold 30px Sans';
            context.textAlign = 'left';
            context.textBaseline = 'middle';
            context.fillText(`${(role === 'dps' ? 'damage' : role).toUpperCase()}`, 128 + 30, 196 + y_val + 25);

            // Player Role Icon 
            roundRectPath(context, 1353, y_val, 93, 246, radius, { tl: false, tr: true, br: true, bl: false });
            context.fillStyle = 'rgb(3, 136, 210)';
            context.fill();
            const roleIcon = await loadImage(path.join(__dirname, `../images/assets/${role}.png`));
            const roleIcon_x = 1353 + (93 - 55) / 2;
            const roleIcon_y = y_val + (246 - 62) / 2;
            context.drawImage(roleIcon, roleIcon_x, roleIcon_y, 55, 62);

            y_val += 275;
        }
    }

    // TEAM B

    // Team Card
    roundRectPath(context, 2395, 264, 1318, 118, radius, { tl: true, tr: true, br: true, bl: true });
    context.fillStyle = 'white';
    context.fill();

    // Team Text
    const team2Img = await loadImage('./images/assets/team2.png');
    context.drawImage(team2Img, 2492, 304, 210, 35);

    y_val = 410;
    for (let role of roleOrder) {
        const playersInRole = team_B.get(role);

        for (let player of playersInRole) {

            // Player Avatar
            const avatarImg = await getAPIimage(players[player].battletag, 'avatar');
            context.drawImage(avatarImg, 1108 + 1378, y_val, 246, 246);

            // Player Namecard
            const namecardImg = await getAPIimage(players[player].battletag, 'namecard');
            roundRectPath(context, 2604 + 128, y_val, 981, 196, radius, { tl: false, tr: true, br: false, bl: false });
            context.save();
            context.clip();
            context.drawImage(namecardImg, 2604 + 128, y_val, 981, 196);
            context.restore();

            const gradient = context.createLinearGradient(2604 + 128, y_val, 2604 + 128 + 981, y_val);
            const steps = 20;
            for (let i = 0; i <= steps; i++) {
                const t = i / steps;
                const alpha = Math.pow(1 - t, 3);
                gradient.addColorStop(t, `rgba(0, 0, 0, ${alpha * 0.4})`);
            }

            roundRectPath(context, 2604 + 128, y_val, 981, 196, radius, { tl: false, tr: false, br: true, bl: false });
            context.fillStyle = gradient;
            context.fill();

            // Player Name
            context.font = 'bold italic 130px Overwatch_Oblique';
            context.fillStyle = 'white';
            context.textAlign = 'left';
            context.textBaseline = 'middle';
            const textY = y_val - 25 + namecardImg.height / 2;
            context.fillText(players[player].battletag.split('#')[0], 2604 + 128 + 30, textY);

            // Player Role Card
            roundRectPath(context, 2604 + 128, 196 + y_val, 980, 51, radius, { tl: false, tr: false, br: true, bl: false });
            context.fillStyle = 'rgb(33,33,33)';
            context.fill();
            context.fillStyle = 'white';
            context.font = 'bold 30px Sans';
            context.textAlign = 'right';
            context.textBaseline = 'middle';
            context.fillText(`${(role === 'dps' ? 'damage' : role).toUpperCase()}`, 2604 + 128 + 980 - 30, 196 + y_val + 25);

            // Player Role Icon 
            roundRectPath(context, 1042 + 1353, y_val, 93, 246, radius, { tl: true, tr: false, br: false, bl: true });
            context.fillStyle = 'rgb(230, 57, 54)';
            context.fill();
            const roleIcon = await loadImage(path.join(__dirname, `../images/assets/${role}.png`));
            const roleIcon_x = 1042 + 1353 + (93 - 55) / 2;
            const roleIcon_y = y_val + (246 - 62) / 2;
            context.drawImage(roleIcon, roleIcon_x, roleIcon_y, 55, 62);

            y_val += 275;
        }
    }

    const buffer = canvas.toBuffer('image/png');
    return new AttachmentBuilder(buffer, { name: 'teams.png' });
}

/**
 * Fetches map from API and returns a randomly chosen map.
 * 
 * @returns {Promise<Map>} Chosen map
 */
async function getRandomMap() {
    try {
        const response = await axios.get('https://overfast-api.tekrop.fr/maps');
        const randomMap = response.data[Math.floor(Math.random() * response.data.length)];

        return randomMap;
    } catch (error) {
        console.error(error);
    }
}

/**
 * Fetches flag image based on two char-length flag code.
 * 
 * @param {string} flag_code String of length two
 * @returns {Promise<Image>} Image of flag
 */
async function getFlagImg(flag_code) {
    try {
        const url = `https://flagsapi.com/${flag_code}/flat/64.png`;
        const response = await axios.get(url, { responseType: 'arraybuffer' });

        return await loadImage(Buffer.from(response.data));;
    } catch (error) {
        console.error('Error loading flag image:', error.message);
        return await loadImage('./images/assets/empty_flag.png');
    }
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

/**
 * Fetches and returns an Image object from Overfast API for a given BattleTag and element type.
 * Falls back to a local default image if fetching fails.
 *
 * @param {string} battleTag The player's BattleTag (e.g., "Player#1234").
 * @param {('namecard'|'avatar')} element The type of image to fetch ("namecard" or "avatar").
 * @returns {Promise<Image>}  A Promise that resolves to a loaded Image object.
 */
async function getAPIimage(battleTag, element) {
    try {
        const formattedTag = battleTag.replace('#', '-');
        const response = await axios.get(`https://overfast-api.tekrop.fr/players/${formattedTag}/summary`);
        let elementURL;
        switch (element) {
            case 'namecard': elementURL = response.data.namecard; break;
            case 'avatar': elementURL = response.data.avatar; break
        }
        const imageResponse = await axios.get(elementURL, { responseType: 'arraybuffer' });
        const base64Image = `data:image/png;base64,${Buffer.from(imageResponse.data, 'binary').toString('base64')}`;
        return await loadImage(base64Image);
    } catch (error) {
        return loadImage(path.join(__dirname, `../images/assets/default_${element}.png`));
    }
}

/**
 * Draws a rectangle with selectively rounded corners
 * 
 * @param {CanvasRenderingContext2D} ctx - The canvas context
 * @param {number} x - Top-left x
 * @param {number} y - Top-left y
 * @param {number} width - Width of the rect
 * @param {number} height - Height of the rect
 * @param {number} radius - Radius of rounded corners
 * @param {Object} corners - Corners to round (e.g., {tl: true, tr: false, br: true, bl: false})
 */
function roundRectPath(ctx, x, y, width, height, radius, corners = { tl: true, tr: true, br: true, bl: true }) {
    ctx.beginPath();
    ctx.moveTo(x + (corners.tl ? radius : 0), y);

    ctx.lineTo(x + width - (corners.tr ? radius : 0), y);
    if (corners.tr) ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
    else ctx.lineTo(x + width, y);

    ctx.lineTo(x + width, y + height - (corners.br ? radius : 0));
    if (corners.br) ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
    else ctx.lineTo(x + width, y + height);

    ctx.lineTo(x + (corners.bl ? radius : 0), y + height);
    if (corners.bl) ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
    else ctx.lineTo(x, y + height);

    ctx.lineTo(x, y + (corners.tl ? radius : 0));
    if (corners.tl) ctx.quadraticCurveTo(x, y, x + radius, y);
    else ctx.lineTo(x, y);

    ctx.closePath();
}

module.exports = {
    generateImage
}