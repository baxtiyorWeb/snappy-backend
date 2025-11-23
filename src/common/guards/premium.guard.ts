import { CanActivate, ExecutionContext, Injectable } from "@nestjs/common";

// src/common/guards/premium.guard.ts
@Injectable()
export class PremiumGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const req = context.switchToHttp().getRequest();
    return req.user?.profile?.isPremium === true;
  }
}