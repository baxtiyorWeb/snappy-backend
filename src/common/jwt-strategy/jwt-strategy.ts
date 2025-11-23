import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, ExtractJwt } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private configService: ConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('JWT_ACCESS_SECRET') as string,
    });

    if (!configService.get<string>('JWT_ACCESS_SECRET')) {
      throw new Error('JWT_ACCESS_SECRET not defined in .env');
    }
  }

  async validate(payload: any) {
    return payload; // req.user ga uzatiladi
  }
}

