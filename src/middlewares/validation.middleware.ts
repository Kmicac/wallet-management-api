import { Request, Response, NextFunction } from 'express';
import { validate, ValidationError } from 'class-validator';
import { plainToClass } from 'class-transformer';

export const validateDto = (dtoClass: any) => {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const dto = plainToClass(dtoClass, req.body);
    const errors: ValidationError[] = await validate(dto);

    if (errors.length > 0) {
      const formattedErrors = errors.map((err) => ({
        field: err.property,
        constraints: err.constraints,
      }));

      res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: formattedErrors,
      });
      return;
    }

    req.body = dto;
    next();
  };
};