Structure du projet complète
dvd-shop-calculator/
├── README.md
├── package.json
├── tsconfig.json
├── .gitignore
├── .eslintrc.json
├── .prettierrc
├── jest.config.js
│
├── docker/
│   ├── Dockerfile
│   ├── Dockerfile.dev
│   ├── .dockerignore
│   └── docker-compose.yml
│
├── terraform/
│   ├── main.tf
│   ├── variables.tf
│   ├── outputs.tf
│   ├── versions.tf
│   ├── environments/
│   │   ├── dev/
│   │   │   ├── terraform.tfvars
│   │   │   └── backend.tf
│   │   ├── staging/
│   │   │   ├── terraform.tfvars
│   │   │   └── backend.tf
│   │   └── prod/
│   │       ├── terraform.tfvars
│   │       └── backend.tf
│   ├── modules/
│   │   ├── compute/
│   │   │   ├── main.tf
│   │   │   ├── variables.tf
│   │   │   └── outputs.tf
│   │   ├── networking/
│   │   │   ├── main.tf
│   │   │   ├── variables.tf
│   │   │   └── outputs.tf
│   │   └── monitoring/
│   │       ├── main.tf
│   │       ├── variables.tf
│   │       └── outputs.tf
│   └── scripts/
│       ├── init.sh
│       ├── plan.sh
│       └── apply.sh
│
├── src/
│   ├── index.ts
│   ├── server.ts                   # API HTTP (optionnel)
│   ├── core/
│   │   ├── calculator.ts
│   │   ├── models/
│   │   │   ├── Cart.ts
│   │   │   ├── Movie.ts
│   │   │   └── Discount.ts
│   │   └── rules/
│   │       ├── DiscountRule.ts
│   │       └── BackToTheFutureDiscountRule.ts
│   ├── infrastructure/
│   │   ├── parsers/
│   │   │   └── CartParser.ts
│   │   ├── formatters/
│   │   │   └── PriceFormatter.ts
│   │   └── api/
│   │       ├── routes/
│   │       │   └── calculator.routes.ts
│   │       └── middleware/
│   │           ├── errorHandler.ts
│   │           └── validation.ts
│   └── utils/
│       ├── constants.ts
│       └── logger.ts
│
├── tests/
│   ├── unit/
│   │   ├── calculator.test.ts
│   │   ├── CartParser.test.ts
│   │   └── BackToTheFutureDiscountRule.test.ts
│   ├── integration/
│   │   └── scenarios.test.ts
│   └── e2e/
│       └── api.test.ts
│
├── docs/
│   ├── ARCHITECTURE.md
│   ├── CONTRIBUTING.md
│   ├── DEPLOYMENT.md              # Guide de déploiement
│   ├── API.md                     # Documentation API (si applicable)
│   └── INFRASTRUCTURE.md          # Documentation infrastructure
│
├── scripts/
│   ├── build.sh
│   ├── test.sh
│   └── deploy.sh
│
└── .github/                       # ou .gitlab/ selon votre plateforme
    └── workflows/
        ├── ci.yml
        ├── cd.yml
        └── terraform.yml
Fichiers Docker clés
Dockerfile (production) :
dockerfile# Multi-stage build pour optimiser la taille
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build && npm prune --production

FROM node:20-alpine
WORKDIR /app
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY package*.json ./
EXPOSE 3000
CMD ["node", "dist/index.js"]
docker-compose.yml :
yamlversion: '3.8'
services:
  app:
    build:
      context: .
      dockerfile: docker/Dockerfile.dev
    volumes:
      - .:/app
      - /app/node_modules
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=development
Infrastructure Terraform
Structure recommandée :

main.tf : Ressources principales (ECS/Fargate, Lambda, ou VM)
modules/ : Composants réutilisables
environments/ : Configuration par environnement

Ressources possibles :

AWS : ECS Fargate, ECR, ALB, CloudWatch
GCP : Cloud Run, Artifact Registry, Load Balancer
Azure : Container Instances, Container Registry, App Gateway

terraform/main.tf (exemple AWS) :
hcl# ECR pour stocker les images Docker
module "ecr" {
  source = "./modules/ecr"
  name   = var.app_name
}

# ECS Fargate pour exécuter les containers
module "compute" {
  source          = "./modules/compute"
  app_name        = var.app_name
  environment     = var.environment
  container_image = module.ecr.repository_url
}

# Monitoring et logs
module "monitoring" {
  source      = "./modules/monitoring"
  app_name    = var.app_name
  environment = var.environment
}
Scripts utiles
scripts/deploy.sh :
bash#!/bin/bash
set -e

ENV=${1:-dev}

echo "Building Docker image..."
docker build -t dvd-shop:latest -f docker/Dockerfile .

echo "Deploying infrastructure with Terraform..."
cd terraform/environments/$ENV
terraform init
terraform plan
terraform apply -auto-approve

echo "Pushing Docker image..."
# Push vers ECR/ACR/GCR selon le cloud provider

echo "Deployment complete!"
```

## Fichiers de configuration additionnels

**.dockerignore** :
```
node_modules
npm-debug.log
dist
.git
.env
*.md
tests
docs
terraform
.github
```

**terraform/.gitignore** :
```
*.tfstate
*.tfstate.backup
.terraform/
*.tfvars
!terraform.tfvars.example
CI/CD Pipeline
.github/workflows/ci.yml :
yamlname: CI
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - run: npm ci
      - run: npm test
      
  docker:
    needs: test
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Build Docker image
        run: docker build -t dvd-shop:${{ github.sha }} .
Cette structure professionnelle permet :

Développement : Docker Compose pour l'environnement local
CI/CD : Build et tests automatisés
Infrastructure as Code : Terraform pour la reproductibilité
Multi-environnement : Dev, Staging, Prod isolés
Production-ready : Monitoring, logs, scalabilité