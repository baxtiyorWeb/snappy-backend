import { Body, Controller, Post } from '@nestjs/common';
import { AuthService } from './auth.service';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) { }

  @Post('register')
  register(@Body() body: { email: string; password: string; confirmPassword: string }) {
    return this.authService.register(body.email, body.password, body.confirmPassword);
  }

  @Post('login')
  login(@Body() body: { email: string; password: string }) {
    console.log(body);

    return this.authService.login(body.email, body.password);
  }

  @Post('refresh')
  refresh(@Body() body: { refresh_token: string }) {
    return this.authService.refreshToken(body.refresh_token);
  }
}
