import { Request, Response } from 'express';
import { AuthService } from '@/services/auth.service';
import { SignInDto, SignUpDto, RefreshTokenDto } from '@/dto/auth.dto';
import { validate } from 'class-validator';
import { plainToClass } from 'class-transformer';
import { logger } from '@/config/logger.config';
import { AuthenticatedRequest } from '@/interfaces/request.interface';

export class AuthController {
  private authService: AuthService;

  constructor() {
    this.authService = new AuthService();
  }

  signUp = async (req: Request, res: Response): Promise<void> => {
    try {
      const dto = plainToClass(SignUpDto, req.body);
      const errors = await validate(dto);

      if (errors.length > 0) {
        res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: errors.map((err) => ({
            field: err.property,
            constraints: err.constraints,
          })),
        });
        return;
      }

      const result = await this.authService.signUp(dto);
      res.status(201).json(result);
    } catch (error: any) {
      logger.error('Error in signUp controller:', error);
      
      if (error.statusCode) {
        res.status(error.statusCode).json({
          success: false,
          error: {
            code: error.code,
            message: error.message,
          },
        });
        return;
      }

      res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Internal server error',
        },
      });
    }
  };

  signIn = async (req: Request, res: Response): Promise<void> => {
    try {
      const dto = plainToClass(SignInDto, req.body);
      const errors = await validate(dto);

      if (errors.length > 0) {
        res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: errors.map((err) => ({
            field: err.property,
            constraints: err.constraints,
          })),
        });
        return;
      }

      const result = await this.authService.signIn(dto);
      res.status(200).json(result);
    } catch (error: any) {
      logger.error('Error in signIn controller:', error);

      if (error.statusCode) {
        res.status(error.statusCode).json({
          success: false,
          error: {
            code: error.code,
            message: error.message,
          },
        });
        return;
      }

      res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Internal server error',
        },
      });
    }
  };

  refreshToken = async (req: Request, res: Response): Promise<void> => {
    try {
      const dto = plainToClass(RefreshTokenDto, req.body);
      const errors = await validate(dto);

      if (errors.length > 0) {
        res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: errors.map((err) => ({
            field: err.property,
            constraints: err.constraints,
          })),
        });
        return;
      }

      const result = await this.authService.refreshToken(dto.refreshToken);
      res.status(200).json(result);
    } catch (error: any) {
      logger.error('Error in refreshToken controller:', error);

      if (error.statusCode) {
        res.status(error.statusCode).json({
          success: false,
          error: {
            code: error.code,
            message: error.message,
          },
        });
        return;
      }

      res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Internal server error',
        },
      });
    }
  };

  signOut = async (req: Request, res: Response): Promise<void> => {
    try {
      const authenticatedReq = req as AuthenticatedRequest;
      const userId = authenticatedReq.user?.id;
      const token = (req as any).token;

      if (!userId || !token) {
        res.status(401).json({
          success: false,
          error: {
            code: 'UNAUTHORIZED',
            message: 'Unauthorized',
          },
        });
        return;
      }

      const result = await this.authService.signOut(userId, token);
      res.status(200).json(result);
    } catch (error: any) {
      logger.error('Error in signOut controller:', error);

      if (error.statusCode) {
        res.status(error.statusCode).json({
          success: false,
          error: {
            code: error.code,
            message: error.message,
          },
        });
        return;
      }

      res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Internal server error',
        },
      });
    }
  };
}