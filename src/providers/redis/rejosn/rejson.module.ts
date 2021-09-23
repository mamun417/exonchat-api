import { Module } from '@nestjs/common';
import { ReJSON } from 'redis-modules-sdk';

const reJsonFactory = {
    provide: 'reJSON', // use @inject(reJSON) in services where we need to use
    useFactory: async () => {
        const client = new ReJSON({
            host: '127.0.0.1',
            port: 6379,
        });

        //Connect to the Redis database
        await client.connect();

        return client;
    },
    inject: [],
};

@Module({
    imports: [],
    providers: [reJsonFactory],
    exports: ['reJSON'], // by exporting we can use full module import and use the provide name
})
export class ReJsonModule {}
