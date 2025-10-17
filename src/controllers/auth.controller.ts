import { Request, Response } from 'express';
import { AuthService } from '@/services/auth.service';
import { SignInDto, SignUpDto, RefreshTokenDto } from '@/dto/auth.dto';
import { AuthenticatedRequest } from '@/interfaces/request.interface';
import { ResponseBuilder } from '@/utils/response.builder';
import { asyncHandler } from '@/middlewares/error.middleware';
import { validate } from 'class-validator';
import { plainToClass } from 'class-transformer';

export class AuthController {
  private authService: AuthService;

  constructor() {
    this.authService = new AuthService();
  }

  signUp = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const dto = plainToClass(SignUpDto, req.body, { enableImplicitConversion: true });
    const errors = await validate(dto);
    
    if (errors.length > 0) {
      res.status(400).json(
        ResponseBuilder.error(
          'Validation failed',
          'VALIDATION_ERROR',
          errors.map((err) => ({
            field: err.property,
            constraints: err.constraints,
          }))
        )
      );
      return;
    }

    const result = await this.authService.signUp(dto);

    res.status(201).json(
      ResponseBuilder.success(result, 'User registered successfully')
    );
  });

  signIn = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const dto = plainToClass(SignInDto, req.body, { enableImplicitConversion: true });
    const errors = await validate(dto);
    
    if (errors.length > 0) {
      res.status(400).json(
        ResponseBuilder.error(
          'Validation failed',
          'VALIDATION_ERROR',
          errors.map((err) => ({
            field: err.property,
            constraints: err.constraints,
          }))
        )
      );
      return;
    }

    const result = await this.authService.signIn(dto);

    res.status(200).json(
      ResponseBuilder.success(result, 'Sign in successful')
    );
  });

  refreshToken = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const dto = plainToClass(RefreshTokenDto, req.body, { enableImplicitConversion: true });
    const errors = await validate(dto);
    
    if (errors.length > 0) {
      res.status(400).json(
        ResponseBuilder.error(
          'Validation failed',
          'VALIDATION_ERROR',
          errors.map((err) => ({
            field: err.property,
            constraints: err.constraints,
          }))
        )
      );
      return;
    }

    const result = await this.authService.refreshToken(dto.refreshToken);

    res.status(200).json(
      ResponseBuilder.success(result, 'Tokens refreshed successfully')
    );
  });

  signOut = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const authenticatedReq = req as AuthenticatedRequest;
    const userId = authenticatedReq.user!.id;
    const token = authenticatedReq.headers.authorization?.replace('Bearer ', '');

    if (!token) {
      res.status(401).json(
        ResponseBuilder.error('No token provided', 'UNAUTHORIZED')
      );
      return;
    }

    await this.authService.signOut(userId, token);

    res.status(200).json(
      ResponseBuilder.successMessage('Sign out successful')
    );
  });
}