import {Collection, MongoClient, ServerApiVersion} from "mongodb";
import * as config from "../config.json";
import logger from "../util/logging";

export class MongoDbService {
    private client: MongoClient;

    constructor() {
        this.client = new MongoClient(config.mongoDbUri, {
            serverApi: ServerApiVersion.v1
        });

        this.init().then(() => {
            logger.info("[MONGO] MongoDB connected.");
        });
    }

    private async init() {
        try {
            await this.client.connect();
        } catch (error) {
            logger.error(error);
            console.error(error);
        }
    }

    public async getCollection<T>(collection: string): Promise<Collection<T>> {
        return this.client.db("Mango").collection<T>(collection);
    }
}