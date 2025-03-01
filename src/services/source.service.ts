import axios, { type AxiosInstance } from 'axios';
import EnvConfig from '../config/enviroment';
class SourceService {
    private readonly httpService: AxiosInstance;

    constructor() {
        this.httpService = axios.create({
            baseURL: EnvConfig.sourceBaseUrl,
            timeout: 10000,
        });
    }
    public async lockUser(): Promise<any> {}
}

const sourceService = new SourceService();

export default sourceService;
