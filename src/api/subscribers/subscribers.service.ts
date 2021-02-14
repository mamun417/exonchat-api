import { Injectable } from '@nestjs/common';
import { CreateSubscriberDto } from './dto/create-subscriber.dto';
import { UpdateSubscriberDto } from './dto/update-subscriber.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Subscriber } from './entities/subscriber.entity';

@Injectable()
export class SubscribersService {
    constructor(
        @InjectRepository(Subscriber)
        private subscribeRepository: Repository<Subscriber>,
    ) {}

    create(createSubscriberDto: CreateSubscriberDto) {
        return 'This action adds a new subscriber';
    }

    async findAll(): Promise<Subscriber[]> {
        return await this.subscribeRepository.find();
    }

    findOne(id: number) {
        return `This action returns a #${id} subscriber`;
    }

    update(id: number, updateSubscriberDto: UpdateSubscriberDto) {
        return `This action updates a #${id} subscriber`;
    }

    remove(id: number) {
        return `This action removes a #${id} subscriber`;
    }
}
