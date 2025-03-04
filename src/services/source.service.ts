import axios, { type AxiosInstance } from 'axios';
import EnvConfig from '../config/enviroment';

import * as cheerio from 'cheerio';
import type { Access } from '../types/access';
import { AccessType, State, type AbmUser, type User } from '../types/User';

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

    async getAbmUserByRun(run: string): Promise<AbmUser | undefined> {
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

        if (users.length === 0) return;
        return {
            userId: users[0].id,
            run: users[0].rut,
            firstName: users[0].nombre,
            lastName: users[0].apellido,
        };
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

    async getLastEntryByUserId(userIds: string[]): Promise<Access[]> {
        const result = userIds.map((id) => `'${id}'`).join(', ');
        const query = `
        -1 /*!12345UNION*/ /*!12345 SELECT*/ 1, CAST((
        /*!12345 SELECT GROUP_CONCAT(CONCAT*/('{"userId": "', CONTACTOID, '", "entryAt": "', MARCAINGRESO,'", "sedeId": "', SEDEID,'"}') SEPARATOR ', ')
        FROM (
            /*!12345 SELECT */ a.CONTACTOID, a.MARCAINGRESO, a.SEDEID
            FROM accesos a
            LEFT JOIN accesos b
            ON a.CONTACTOID = b.CONTACTOID AND a.MARCAINGRESO < b.MARCAINGRESO
            WHERE a.CONTACTOID IN (${result}) AND DATE(a.MARCAINGRESO) = CURDATE()
            GROUP BY a.CONTACTOID, a.MARCAINGRESO
            HAVING COUNT(b.MARCAINGRESO) = 0
        ) t
        ) AS /*!12345 CHAR*/ ) COLLATE utf8_general_ci, 3, 4, 5, 6, 7, 8, 9, 10, 11
        `;

        const encodedQuery = encodeURIComponent(query);

        const response = await this.httpService.get(
            `/abm/abm_sedes.php?EDITARID=${encodedQuery}`,
            {}
        );

        const html = response.data;

        // Load the HTML into cheerio
        const $ = cheerio.load(html);

        const stringValue = $('input[name="NOMBRE"]').attr('value');
        if (!stringValue) return [];

        return JSON.parse(`[${stringValue}]`);
    }
}
const sourceService = new SourceService();

export { sourceService, SourceService };
