import swaggerJsdoc from 'swagger-jsdoc';

const options: swaggerJsdoc.Options = {
    definition: {
        openapi: '3.0.0',
        info: {
            title: 'Dok API Documentation',
            version: '1.0.0',
            description: 'API documentation for the Dok collaborative document editor application.',
        },
        servers: [
            {
                url: 'http://localhost:3000',
                description: 'Development Server',
            },
        ],
        components: {
            securitySchemes: {
                BearerAuth: {
                    type: 'http',
                    scheme: 'bearer',
                    bearerFormat: 'JWT',
                    description: 'Inserisci il token JWT in questo formato: Bearer <token>',
                },
            },
        },
        security: [
            {
                BearerAuth: [],
            },
        ],
    },
    apis: ['./src/routes/*.ts', './src/routes/*.js', './src/app.ts', './src/app.js'],
};

export const swaggerSpec = swaggerJsdoc(options);
