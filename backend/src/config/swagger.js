const swaggerJSDoc = require('swagger-jsdoc');

const options = {
  definition: {
    openapi: '3.0.3',
    info: {
      title: 'Job Swipe API',
      version: '1.0.0',
      description: 'API backend de la plateforme de matching professionnel Job Swipe.',
    },
    servers: [{ url: 'http://localhost:3000' }],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
      schemas: {
        Language: {
          type: 'object',
          required: ['name', 'level'],
          properties: {
            name: { type: 'string', example: 'Français' },
            level: { type: 'string', example: 'Courant' },
          },
        },
        CandidateProfile: {
          type: 'object',
          properties: {
            firstName: { type: 'string', example: 'Alex' },
            lastName: { type: 'string', example: 'Martin' },
            title: { type: 'string', example: 'Développeur Node.js' },
            location: { type: 'string', example: 'Paris' },
            experience: { type: 'string', example: '3 ans' },
            availability: { type: 'string', enum: ['immediate', 'within1Month', 'within3Months'] },
            workMode: { type: 'string', enum: ['onsite', 'hybrid', 'remote'] },
            salaryMin: { type: 'number', example: 40000 },
            salaryMax: { type: 'number', example: 50000 },
            bio: { type: 'string' },
            skills: { type: 'array', items: { type: 'string' } },
            languages: { type: 'array', items: { $ref: '#/components/schemas/Language' } },
            degree: { type: 'string', example: 'Master' },
            diploma: { type: 'string', example: 'Informatique' },
            school: { type: 'string', example: 'Universite de Paris' },
            graduationYear: { type: 'integer', example: 2022 },
            cvUrl: { type: 'string', example: '/api/profile/cv' },
          },
        },
        RecruiterProfile: {
          type: 'object',
          properties: {
            companyName: { type: 'string', example: 'Tech Solutions' },
            companySector: { type: 'string', example: 'Technologie' },
            companySize: { type: 'string', example: '50-100' },
            companyCity: { type: 'string', example: 'Paris' },
            recruiterName: { type: 'string', example: 'Sophie Bernard' },
            recruiterPosition: { type: 'string', example: 'Responsable recrutement' },
          },
        },
        User: {
          type: 'object',
          properties: {
            id: { type: 'string', example: '64ec0bd6a9cf5bd0bd85d9fa' },
            email: { type: 'string', format: 'email', example: 'user@example.com' },
            role: { type: 'string', enum: ['candidate', 'recruiter'] },
            status: { type: 'string', enum: ['active', 'pending', 'disabled'] },
            emailVerified: { type: 'boolean', example: false },
            profile: {
              oneOf: [
                { $ref: '#/components/schemas/CandidateProfile' },
                { $ref: '#/components/schemas/RecruiterProfile' },
              ],
              nullable: true,
            },
          },
        },
        JobOffer: {
          type: 'object',
          properties: {
            _id: { type: 'string' },
            recruiterId: { type: 'string' },
            title: { type: 'string', example: 'Developpeur Node.js' },
            contractType: { type: 'string', enum: ['CDI', 'CDD', 'Alternance', 'Stage', 'Freelance', 'Temps partiel'] },
            city: { type: 'string', example: 'Paris' },
            remoteMode: { type: 'string', enum: ['onsite', 'hybrid', 'remote'] },
            salaryMin: { type: 'number', example: 40000 },
            salaryMax: { type: 'number', example: 50000 },
            minimumDegree: { type: 'string', example: 'Master' },
            requiredSkills: { type: 'array', items: { type: 'string' } },
            requiredLanguages: { type: 'array', items: { $ref: '#/components/schemas/Language' } },
            description: { type: 'string' },
            status: { type: 'string', enum: ['published', 'closed'] },
          },
        },
        Match: {
          type: 'object',
          properties: {
            _id: { type: 'string' },
            candidateId: { type: 'string' },
            recruiterId: { type: 'string' },
            jobOfferId: { type: 'string' },
            status: { type: 'string', enum: ['pending', 'accepted', 'rejected'] },
          },
        },
        Conversation: {
          type: 'object',
          properties: {
            _id: { type: 'string' },
            matchId: { type: 'string' },
            participantIds: { type: 'array', items: { type: 'string' } },
            lastMessageAt: { type: 'string', format: 'date-time' },
          },
        },
        Message: {
          type: 'object',
          properties: {
            _id: { type: 'string' },
            conversationId: { type: 'string' },
            senderId: { type: 'string' },
            senderRole: { type: 'string', enum: ['candidate', 'recruiter'] },
            content: { type: 'string', example: 'Bonjour, votre offre m interesse.' },
          },
        },
        Error: {
          type: 'object',
          properties: {
            message: { type: 'string', example: 'Token manquant.' },
          },
        },
      },
    },
  },
  apis: [],
};

const swaggerSpec = swaggerJSDoc(options);

swaggerSpec.paths = {
  '/health': {
    get: {
      summary: 'Verifier la sante du serveur',
      responses: { 200: { description: 'Serveur disponible.' } },
    },
  },
  '/api/auth/signup': {
    post: {
      summary: 'Creer un compte',
      requestBody: {
        required: true,
        content: { 'application/json': { schema: { type: 'object', required: ['email', 'password', 'role'], properties: { email: { type: 'string' }, password: { type: 'string', format: 'password' }, role: { type: 'string', enum: ['candidate', 'recruiter'] } } } } },
      },
      responses: { 201: { description: 'Compte cree.' }, 400: { description: 'Donnees invalides.', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } }, 409: { description: 'Email deja utilise.' } },
    },
  },
  '/api/auth/login': {
    post: {
      summary: 'Se connecter',
      requestBody: { required: true, content: { 'application/json': { schema: { type: 'object', required: ['email', 'password'], properties: { email: { type: 'string' }, password: { type: 'string', format: 'password' } } } } } },
      responses: { 200: { description: 'Connexion reussie.' }, 401: { description: 'Identifiants invalides.' } },
    },
  },
  '/api/auth/me': {
    get: {
      summary: 'Recuperer l utilisateur connecte',
      security: [{ bearerAuth: [] }],
      responses: { 200: { description: 'Utilisateur courant.' }, 401: { description: 'Token invalide ou absent.' } },
    },
  },
  '/api/profile': {
    get: { summary: 'Consulter son profil', security: [{ bearerAuth: [] }], responses: { 200: { description: 'Profil utilisateur.' }, 401: { description: 'Non authentifie.' } } },
    patch: { summary: 'Modifier son profil', security: [{ bearerAuth: [] }], requestBody: { required: true, content: { 'application/json': { schema: { type: 'object' } } } }, responses: { 200: { description: 'Profil mis a jour.' }, 400: { description: 'Donnees invalides.' } } },
  },
  '/api/profile/cv': {
    post: { summary: 'Importer un CV PDF', security: [{ bearerAuth: [] }], requestBody: { required: true, content: { 'multipart/form-data': { schema: { type: 'object', required: ['cv'], properties: { cv: { type: 'string', format: 'binary' } } } } } }, responses: { 201: { description: 'CV enregistre.' }, 400: { description: 'Fichier invalide.' } } },
    get: { summary: 'Telecharger son CV', security: [{ bearerAuth: [] }], responses: { 200: { description: 'Fichier PDF.', content: { 'application/pdf': { schema: { type: 'string', format: 'binary' } } } }, 404: { description: 'CV introuvable.' } } },
    delete: { summary: 'Supprimer son CV', security: [{ bearerAuth: [] }], responses: { 204: { description: 'CV supprime.' } } },
  },
  '/api/jobs': {
    get: { summary: 'Lister les offres', security: [{ bearerAuth: [] }], parameters: [{ name: 'city', in: 'query', schema: { type: 'string' } }, { name: 'contractType', in: 'query', schema: { type: 'string' } }, { name: 'remoteMode', in: 'query', schema: { type: 'string' } }, { name: 'page', in: 'query', schema: { type: 'integer' } }, { name: 'limit', in: 'query', schema: { type: 'integer' } }], responses: { 200: { description: 'Liste paginee des offres.' } } },
    post: { summary: 'Creer une offre', security: [{ bearerAuth: [] }], requestBody: { required: true, content: { 'application/json': { schema: { $ref: '#/components/schemas/JobOffer' } } } }, responses: { 201: { description: 'Offre creee.' }, 403: { description: 'Role recruteur requis.' } } },
  },
  '/api/jobs/{id}': {
    parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
    get: { summary: 'Consulter une offre', security: [{ bearerAuth: [] }], responses: { 200: { description: 'Offre demandee.' }, 404: { description: 'Offre introuvable.' } } },
    patch: { summary: 'Modifier une offre', security: [{ bearerAuth: [] }], requestBody: { content: { 'application/json': { schema: { $ref: '#/components/schemas/JobOffer' } } } }, responses: { 200: { description: 'Offre mise a jour.' }, 404: { description: 'Offre introuvable.' } } },
    delete: { summary: 'Supprimer une offre', security: [{ bearerAuth: [] }], responses: { 204: { description: 'Offre supprimee.' } } },
  },
  '/api/matches': {
    get: { summary: 'Lister ses matchs', security: [{ bearerAuth: [] }], responses: { 200: { description: 'Liste des matchs.' } } },
  },
  '/api/matches/offers/{jobOfferId}': {
    post: { summary: 'Manifester son interet pour une offre', security: [{ bearerAuth: [] }], parameters: [{ name: 'jobOfferId', in: 'path', required: true, schema: { type: 'string' } }], responses: { 201: { description: 'Match cree avec le statut pending.' }, 409: { description: 'Candidature deja existante.' } } },
  },
  '/api/matches/{id}/candidate-profile': {
    get: { summary: 'Consulter le profil candidat lie a un match', security: [{ bearerAuth: [] }], parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }], responses: { 200: { description: 'Profil candidat.' }, 403: { description: 'Recruteur requis.' }, 404: { description: 'Match introuvable.' } } },
  },
  '/api/matches/{id}/candidate-cv': {
    get: { summary: 'Telecharger le CV candidat lie a un match', security: [{ bearerAuth: [] }], parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }], responses: { 200: { description: 'CV PDF.', content: { 'application/pdf': { schema: { type: 'string', format: 'binary' } } } }, 404: { description: 'CV introuvable.' } } },
  },
  '/api/matches/{id}/status': {
    patch: { summary: 'Accepter ou refuser une candidature', security: [{ bearerAuth: [] }], parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }], requestBody: { required: true, content: { 'application/json': { schema: { type: 'object', required: ['status'], properties: { status: { type: 'string', enum: ['accepted', 'rejected'] } } } } } }, responses: { 200: { description: 'Statut mis a jour.' }, 403: { description: 'Recruteur requis.' } } },
  },
  '/api/conversations': {
    get: { summary: 'Lister ses conversations', security: [{ bearerAuth: [] }], responses: { 200: { description: 'Conversations accessibles.' } } },
  },
  '/api/conversations/{id}/messages': {
    parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
    get: { summary: 'Lire les messages', security: [{ bearerAuth: [] }], responses: { 200: { description: 'Messages de la conversation.' }, 404: { description: 'Conversation inaccessible.' } } },
    post: { summary: 'Envoyer un message', security: [{ bearerAuth: [] }], requestBody: { required: true, content: { 'application/json': { schema: { type: 'object', required: ['content'], properties: { content: { type: 'string', maxLength: 5000 } } } } } }, responses: { 201: { description: 'Message envoye.' }, 400: { description: 'Message invalide.' }, 404: { description: 'Conversation inaccessible.' } } },
  },
};

module.exports = swaggerSpec;
