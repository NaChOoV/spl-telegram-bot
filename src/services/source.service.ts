import axios, { type AxiosInstance } from 'axios';
import EnvConfig from '../config/enviroment';

import * as cheerio from 'cheerio';
import { AccessType, State, type User } from '../types/User';

class SourceService {
    private readonly httpService: AxiosInstance;

    constructor() {
        this.httpService = axios.create({
            baseURL: EnvConfig.sourceBaseUrl,
            timeout: 10000,
        });
    }

    async login(): Promise<string[]> {
        const formData = {
            LOGIN: EnvConfig.sourceUsername,
            CLAVE: EnvConfig.sourcePassword,
        };

        const headers = { 'user-agent': '' };
        const formDataURLEncoded = new URLSearchParams(formData).toString();

        const response = await this.httpService.post('/login_servidor.php', formDataURLEncoded, {
            headers: {
                ...headers,
                'Content-Type': 'application/x-www-form-urlencoded',
            },
        });

        if (!response.data.estado?.sesion) {
            throw new Error('Authentication failed');
        }
        const cookies = response.headers['set-cookie'];
        if (!cookies) {
            throw new Error('No cookies received');
        }

        // Store the cookies or return them
        return cookies;
    }

    async getIdByRun(run: string): Promise<string | undefined> {
        const response = await this.httpService.get(`/abm/abm_socios.php?CONTACTOCAMPO7=${run}`);
        const html = response.data;

        // Load the HTML into cheerio
        const $ = cheerio.load(html);

        // Find the table with id "listado" and extract the rows
        const users: any[] = [];

        // Skip the header row by starting with 'tbody tr'
        //ts-ignore
        $('#listado tbody tr').each((_, element) => {
            const tds = $(element).find('td');

            // Extract data from each cell
            const user = {
                id: $(tds[0]).text().trim(),
                rut: $(tds[1]).text().trim(),
                apellido: $(tds[2]).text().trim(),
                nombre: $(tds[3]).text().trim(),
                sexo: $(tds[4]).text().trim(),
            };

            users.push(user);
        });

        return users.length != 0 && users[0].id;
    }

    async getUserProfile(userId: string, cookies: string[]): Promise<User> {
        const headers = {
            'user-agent': '',
            'Content-Type': 'application/x-www-form-urlencoded',
            cookie: cookies.join('; '),
        };

        const formData = {
            QUERY: 'VERPERFIL',
            IDCONTACTO: userId,
        };
        const formDataURLEncoded = new URLSearchParams(formData).toString();

        const response = await this.httpService.post('/main_servidor.php', formDataURLEncoded, {
            headers,
        });

        const $ = cheerio.load(response.data.html);
        // Find the image element and extract the 'src' attribute
        const imageUrl = $('#contact-image').attr('src');
        let image: string | undefined;

        if (imageUrl && imageUrl.startsWith('https://storage.googleapis.com/')) {
            image = imageUrl;
        }

        return { imageUrl: image };
    }

    async blockUser(userId: string, cookies: string[]): Promise<void> {
        const headers = {
            'user-agent': '',
            'Content-Type': 'application/x-www-form-urlencoded',
            cookie: cookies.join('; '),
        };

        const formData = {
            QUERY: 'EDITARPERFIL',
            IDCONTACTO: userId,
            DATOSFORM: `ESTADO=${State.INACTIVO}&CONTACTOCAMPO14=${AccessType.QR}`,
        };
        const formDataURLEncoded = new URLSearchParams(formData).toString();

        await this.httpService.post('/main_servidor.php', formDataURLEncoded, {
            headers,
        });
    }

    async unBlockUser(userId: string, cookies: string[]): Promise<void> {
        const headers = {
            'user-agent': '',
            'Content-Type': 'application/x-www-form-urlencoded',
            cookie: cookies.join('; '),
        };

        const formData = {
            QUERY: 'EDITARPERFIL',
            IDCONTACTO: userId,
            DATOSFORM: `ESTADO=${State.ACTIVO}&CONTACTOCAMPO14=${AccessType.BIOMETRIA}`,
        };
        const formDataURLEncoded = new URLSearchParams(formData).toString();

        await this.httpService.post('/main_servidor.php', formDataURLEncoded, {
            headers,
        });
    }
}
const sourceService = new SourceService();

export { sourceService, SourceService };
