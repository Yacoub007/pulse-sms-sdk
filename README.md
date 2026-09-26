# @yacoub007/pulse-sms-sdk

> SDK client officiel Node.js & TypeScript pour la passerelle haute résilience **Pulse-SMS Gateway** (SMS Mauritanie +222 & WhatsApp Business).  
> Publié sur **GitHub Packages** (`npm.pkg.github.com`).

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node: >=20](https://img.shields.io/badge/Node->=20-blue.svg)](https://nodejs.org/)
[![Registry: GitHub Packages](https://img.shields.io/badge/GitHub%20Packages-%40yacoub007-brightgreen.svg)](https://github.com/Yacoub007/pulse-sms-sdk/packages)

---

## 🎯 Fonctionnalités Clés

- **SMS & WhatsApp Unifiés** : Bascule transparente entre SMS national mauritanien (`+222`) et WhatsApp Business API.
- **Support Double Mode d'Exécution** :
  - **Synchrone (`sync`)** : Traitement direct avec confirmation immédiate du compte relais Firebase et de l'ID du message.
  - **Asynchrone (`async`)** : Enfilage direct dans **Redis Streams** pour absorber les pics et campagnes de masse sans latence.
- **Templates Dynamiques Bilingues** : Support des variables dynamiques (`{{code}}`, `{{item}}`, `{{price}}`, `{{url}}`) en Français et Arabe.
- **Observabilité & Santé** : Méthodes natives `checkHealth()` et `getStats()` pour monitorer l'état de la flotte et des files Redis.
- **Flotte Multi-Comptes & Proxies** : Routage transparent et load balancing à travers un pool de 10+ comptes Firebase (100k+ SMS gratuits / mois).
- **Typage Strict TypeScript** : Interfaces complètes pour chaque paramètre, réponse, code d'erreur et payload.

---

## 📦 Installation depuis GitHub Packages

### 1. Configuration du registre GitHub (`.npmrc`)

Pour installer le package depuis **GitHub Packages**, ajoutez ou modifiez votre fichier `.npmrc` à la racine de votre projet :

```ini
@yacoub007:registry=https://npm.pkg.github.com
//npm.pkg.github.com/:_authToken=${GITHUB_TOKEN}
```

> **Note :** Votre `GITHUB_TOKEN` (ou Personal Access Token avec scope `read:packages`) doit être configuré dans vos variables d'environnement.

### 2. Installation de la dépendance

```bash
# npm
npm install @yacoub007/pulse-sms-sdk

# pnpm
pnpm add @yacoub007/pulse-sms-sdk

# yarn
yarn add @yacoub007/pulse-sms-sdk
```

---

## 🚀 Guide de Démarrage Rapide

### 1. Initialisation du client

Obtenez votre clé API secrète (`sk_live_...` ou `sk_test_...`) depuis le **Pulse Studio** (`http://localhost:4010` ou votre domaine hébergé) dans l'onglet **Clés API & Clients**.

```typescript
import { PulseSmsClient } from "@yacoub007/pulse-sms-sdk";

const pulse = new PulseSmsClient({
  apiKey: process.env.PULSE_SMS_API_KEY || "sk_live_votre_cle_api",
  baseUrl: process.env.PULSE_SMS_URL || "https://sms-gateway.souq.mr",
  timeoutMs: 8000,
});
```

---

### 2. Envoi d'un Code OTP (Vérification Téléphone)

```typescript
// Envoi synchrone par SMS (+222 Mauritanie)
const result = await pulse.sendOtp({
  to: "+22246123456",
  code: "849201",
  channel: "sms", // ou "whatsapp"
  mode: "sync",
});

console.log("Statut :", result.status); // "SENT"
console.log("Routé via le compte :", result.dispatchedVia?.projectId);
```

---

### 3. Envoi d'une Notification Templatée (Enchère, Alerte, Facture)

```typescript
// Notification WhatsApp bilingue avec variables
const alertResult = await pulse.sendMessage({
  to: "+22236112233",
  templateId: "tpl_outbid_alert",
  variables: {
    item: "Toyota Hilux 2022",
    price: "4 850 000 MRU",
    url: "https://souq.mr/auctions/lot-849",
  },
  lang: "fr", // ou "ar"
  channel: "whatsapp",
  mode: "async", // Enfilage asynchrone dans Redis Stream
});

console.log("Enfilé avec succès. Job ID :", alertResult.jobId);
```

---

### 4. Envoi par Lot (Campagnes & Notifications Massives)

```typescript
const batchResult = await pulse.sendBatch([
  { to: "+22246123456", code: "123456" },
  { to: "+22233112233", code: "654321" },
  { 
    to: "+22222110099", 
    templateId: "tpl_auction_win", 
    variables: { item: "MacBook Pro M3", price: "95 000 MRU" } 
  },
]);

console.log(`Enfilé avec succès : ${batchResult.totalQueued} messages.`);
console.log("Job IDs générés :", batchResult.jobIds);
```

---

### 5. Listing des Modèles Enregistrés

```typescript
const templates = await pulse.listTemplates();
for (const t of templates) {
  console.log(`Modèle : ${t.name} (${t.id}) - Variables : [${t.variables.join(", ")}]`);
}
```

---

### 6. Observabilité & Santé du Gateway

```typescript
// Sonde de santé publique
const health = await pulse.checkHealth();
console.log("État Gateway :", health.status, "- Flotte :", health.fleet.totalAccounts, "comptes");

// Métriques détaillées (Capacité, Redis Stream, Proxies)
const stats = await pulse.getStats();
console.log("Capacité mensuelle totale :", stats.fleet.totalCapacity);
console.log("Messages en file d'attente Redis :", stats.queue.queued);
```

---

## 🛡️ Gestion des Erreurs

Le SDK soulève des exceptions claires contenant le code HTTP et le message détaillé retourné par la passerelle :

```typescript
try {
  await pulse.sendOtp({ to: "+22246123456", code: "123456" });
} catch (error: any) {
  if (error.message.includes("401")) {
    console.error("Clé API invalide ou inactive.");
  } else if (error.message.includes("429")) {
    console.error("Quota mensuel atteint ou rate-limit déclenché.");
  } else {
    console.error("Erreur de dispatch :", error.message);
  }
}
```

---

## 🏗️ Publication sur GitHub Packages

Ce package est configuré pour être automatiquement publié sur GitHub Packages :

```bash
# 1. Compilation des types et bundles
npm run build

# 2. Exécution des tests unitaires
npm test

# 3. Publication vers https://npm.pkg.github.com
npm publish
```

---

## 📄 Licence

MIT © Yacoub007 / Souq MR Platform. Tous droits réservés.
