import { Module } from '@nestjs/common';

import { PassportModule } from '@nestjs/passport';
import { JwtModule } from '@nestjs/jwt';

import { LocalStrategy } from './strategies/local.strategy';
import { JwtStrategy } from './strategies/jwt.strategy';

import { jwtConstants } from './constants/constants';

import { AuthService } from './auth.service';

import { PrismaService } from 'src/prisma.service';

@Module({
    imports: [
        PassportModule,
        JwtModule.register({
            secret: jwtConstants.secret,
            signOptions: { expiresIn: '60m' },
        }),
    ],
    providers: [AuthService, LocalStrategy, JwtStrategy, PrismaService],
    exports: [AuthService],
})
export class AuthModule {}
