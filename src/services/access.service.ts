import axios, { type AxiosInstance } from 'axios';
import EnvConfig from '../config/enviroment';
import type { Access } from '../types/access';
import type { ResponseData } from '../types/shared';

class AccessService {
    private readonly httpService: AxiosInstance;

    constructor() {
        this.httpService = axios.create({
            baseURL: EnvConfig.accessBaseUrl,
            timeout: 10000,
        });
    }

    public async getAccess(): Promise<ResponseData<Access>> {
        const response = await this.httpService.get<ResponseData<Access>>('/access/complete', {
            headers: { 'X-Auth-Token': EnvConfig.accessAuthString },
        });

        return response.data;
    }
}

const accessService = new AccessService();

export default accessService;
