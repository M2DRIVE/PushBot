// test.mjs
import { loadImage } from '@napi-rs/canvas';
import axios from 'axios';

const response = await axios.get(`https://overfast-api.tekrop.fr/players/Mango-18517/summary`);
console.log(response.data);