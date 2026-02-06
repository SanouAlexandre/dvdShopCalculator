# DVD Shop Calculator 🎬

Application de calcul de prix pour une boutique de DVDs avec système de promotions intelligent pour la saga "Back to the Future".

## Table des matières

- [À propos](#à-propos)
- [Fonctionnalités](#fonctionnalités)
- [Prérequis](#prérequis)
- [Installation](#installation)
- [Utilisation](#utilisation)
- [Architecture](#architecture)
- [Tests](#tests)
- [Docker](#docker)
- [Déploiement](#déploiement)
- [License](#license)

## À propos

Ce projet calcule automatiquement le prix d'un panier de DVDs en appliquant des règles promotionnelles spécifiques pour la trilogie "Back to the Future".

### Règles de tarification

- **DVD standard** : 20 €
- **DVD Back to the Future** : 15 € l'unité
- **Promotion 2 volets différents** : -10% sur tous les DVDs BTTF
- **Promotion 3 volets différents** : -20% sur tous les DVDs BTTF

### Exemples de calcul
```
Panier: Back to the Future 1, Back to the Future 2, Back to the Future 3
Prix: 36 € (3 volets × 15 € × 0.8)

Panier: Back to the Future 1, Back to the Future 2
Prix: 27 € (2 volets × 15 € × 0.9)

Panier: Back to the Future 1, Back to the Future 2, Back to the Future 3, La chèvre
Prix: 56 € ((3 × 15 € × 0.8) + 20 €)
```

## Fonctionnalités

- Calcul automatique des prix avec promotions
- Support de plusieurs formats d'entrée (CLI, API, fichier)
- Validation des données d'entrée
- Extensible pour ajouter de nouvelles règles promotionnelles
- API REST (optionnel)
- Logs structurés
- Containerisé avec Docker
- Infrastructure as Code avec Terraform

## Prérequis

- **Node.js** >= 20.x
- **npm** >= 10.x
- **Docker** >= 24.x (optionnel)
- **Terraform** >= 1.6.x (pour le déploiement)

## Installation

### Installation standard
```bash
# Cloner le repository
git clone https://github.com/votre-org/dvd-shop-calculator.git
cd dvd-shop-calculator

# Installer les dépendances
npm install

# Compiler le projet
npm run build
```

### Installation avec Docker
```bash
# Build de l'image
docker build -t dvd-shop-calculator -f docker/Dockerfile .

# Ou utiliser Docker Compose
docker-compose -f docker/docker-compose.yml up
```

## Utilisation

### CLI (ligne de commande)
```bash
# Mode interactif
npm run start:cli

# Avec un fichier en entrée
npm start -- --file panier.txt

# Avec une entrée directe
echo "Back to the Future 1\nBack to the Future 2\nBack to the Future 3" | npm start
```

### Utilisation programmatique
```typescript
import { Calculator } from './core/calculator';
import { CartParser } from './infrastructure/parsers/CartParser';

const input = `Back to the Future 1
Back to the Future 2
Back to the Future 3`;

const parser = new CartParser();
const calculator = new Calculator();

const cart = parser.parse(input);
const totalPrice = calculator.calculateTotal(cart);

console.log(`Prix total: ${totalPrice} €`);
```

### API REST (si activée)
```bash
# Démarrer le serveur
npm start

# Calculer un panier
curl -X POST http://localhost:3000/api/calculate \
  -H "Content-Type: application/json" \
  -d '{
    "items": [
      "Back to the Future 1",
      "Back to the Future 2",
      "Back to the Future 3"
    ]
  }'

# Réponse
{
  "totalPrice": 36,
  "currency": "EUR",
  "itemsCount": 3,
  "discountApplied": "20%"
}
```

## Architecture
```
src/
├── core/               # Logique métier (Domain Layer)
├── infrastructure/     # Adaptateurs externes
├── utils/             # Utilitaires partagés
└── index.ts           # Point d'entrée
```

### Principes de conception

- **Clean Architecture** : Séparation claire des responsabilités
- **SOLID** : Notamment Open/Closed pour l'extensibilité
- **Domain-Driven Design** : Vocabulaire métier explicite
- **Dependency Injection** : Facilite les tests et la maintenance

### Diagramme de flux
```
Input (text) → CartParser → Cart Model → Calculator → Discount Rules → Total Price
```

Pour plus de détails, voir [ARCHITECTURE.md](docs/ARCHITECTURE.md)

## Tests

### Exécuter tous les tests
```bash
# Tests unitaires + intégration
npm test

# Tests avec couverture
npm run test:coverage

# Tests en mode watch
npm run test:watch

# Tests end-to-end
npm run test:e2e
```

### Structure des tests

- **Unit tests** : Tests des composants isolés
- **Integration tests** : Tests des 5 exemples fournis
- **E2E tests** : Tests de bout en bout (API si applicable)

### Couverture attendue

- Couverture de code : > 90%
- Tous les exemples fournis doivent passer

##  Docker

### Développement local
```bash
# Démarrer l'environnement de dev
docker-compose -f docker/docker-compose.yml up

# Rebuilder après modifications
docker-compose -f docker/docker-compose.yml up --build
```

### Build de production
```bash
# Build de l'image optimisée
docker build -t dvd-shop-calculator:latest -f docker/Dockerfile .

# Exécuter le container
docker run -p 3000:3000 dvd-shop-calculator:latest

# Tag et push vers un registry
docker tag dvd-shop-calculator:latest registry.example.com/dvd-shop:v1.0.0
docker push registry.example.com/dvd-shop:v1.0.0
```

## Déploiement

### Infrastructure avec Terraform
```bash
# Initialiser Terraform
cd terraform/environments/dev
terraform init

# Planifier les changements
terraform plan

# Appliquer l'infrastructure
terraform apply

# Détruire l'infrastructure
terraform destroy
```

### Déploiement automatisé
```bash
# Script de déploiement complet
./scripts/deploy.sh dev    # Déploiement en dev
./scripts/deploy.sh staging # Déploiement en staging
./scripts/deploy.sh prod   # Déploiement en production
```

### Environnements

- **dev** : Développement et tests
- **staging** : Pré-production
- **prod** : Production


## Scripts disponibles

| Commande | Description |
|----------|-------------|
| `npm start` | Démarrer le serveur API (localhost:3000) |
| `npm run start:cli` | Lancer l'application en mode CLI |
| `npm run build` | Compiler le TypeScript |
| `npm test` | Exécuter les tests |
| `npm run test:coverage` | Tests avec rapport de couverture |
| `npm run lint` | Vérifier le code avec ESLint |
| `npm run lint:fix` | Corriger automatiquement les erreurs |
| `npm run format` | Formater le code avec Prettier |
| `npm run docker:build` | Build de l'image Docker |
| `npm run docker:run` | Exécuter le container Docker |


### Standards de code

- Suivre les conventions TypeScript
- Maintenir une couverture de tests > 90%
- Passer tous les checks ESLint et Prettier
- Documenter les nouvelles fonctionnalités


## License

Ce projet est sous licence MIT. Voir le fichier [LICENSE](LICENSE) pour plus de détails.



---

**Note** : Ce projet a été développé dans le cadre du processus de recrutement chez Ekinox.