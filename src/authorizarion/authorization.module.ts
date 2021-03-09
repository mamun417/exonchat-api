import { Module } from '@nestjs/common';
import { CatsController } from './cats.controller';
import { APP_GUARD } from '@nestjs/core';
import { RolesGuard } from './guard/roles.guard';

@Module({
    imports: [],
    controllers: [CatsController],
    providers: [],
    exports: [],
})
export class AuthorizationModule {}
