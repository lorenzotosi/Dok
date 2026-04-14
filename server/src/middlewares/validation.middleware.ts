import type { Request, Response, NextFunction } from 'express';

export const requireBodyField = (fieldName: string) => {
    return (req: Request, res: Response, next: NextFunction): void => {
        const value = req.body[fieldName];
        if (value === undefined || value === null || (typeof value === 'string' && value.trim() === '')) {
            res.status(400).json({ error: `Bad Request: Il campo obbligatorio '${fieldName}' è mancante o vuoto.` });
            return;
        }
        next();
    };
};

export const validateMongoIdParam = (paramName: string) => {
    return (req: Request, res: Response, next: NextFunction): void => {
        const id = req.params[paramName];
        if (!id || id.length !== 24) {
            res.status(400).json({ error: `Bad Request: L'ID '${id}' fornito in '${paramName}' non è un formato MongoDB valido.` });
            return;
        }
        next();
    };
};
