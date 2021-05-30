import { HttpModule, Module } from '@nestjs/common';
import { PrismaService } from 'src/prisma.service';
import { ProfileController } from './profile.controller';
import { ProfileService } from './profile.service';

@Module({
    imports: [HttpModule],
    controllers: [ProfileController],
    providers: [PrismaService, ProfileService],
})
export class ProfileModule {}
