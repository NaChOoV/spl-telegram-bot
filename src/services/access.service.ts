import axios, { type AxiosInstance } from 'axios';
import EnvConfig from '../config/enviroment';
import type { Access1 } from '../types/access';
import type { ResponseData } from '../types/shared';

class AccessService {
    private readonly httpService: AxiosInstance;

    constructor() {
        this.httpService = axios.create({
            baseURL: EnvConfig.accessBaseUrl,
            timeout: 10000,
        });
    }

    public async getAccess(): Promise<ResponseData<Access1>> {
        const response = await this.httpService.get<ResponseData<Access1>>('/access/complete', {
            headers: { 'X-Auth-Token': EnvConfig.accessAuthString },
        });

        return response.data;
    }
}

const accessService = new AccessService();

export { accessService, AccessService };
