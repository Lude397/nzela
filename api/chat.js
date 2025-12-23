// ==================== HANDLER ====================
export default async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    if (req.method === 'OPTIONS') return res.status(200).end();
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

    try {
        const { mode, message, history, docType } = req.body;

        if (mode === 'chat') {
            return await handleChat(res, message, history);
        }
        
        if (mode === 'generate') {
            return await handleGenerate(res, history, docType);
        }

        return res.status(400).json({ error: 'Mode invalide' });

    } catch (error) {
        console.error('Error:', error);
        return res.status(500).json({ error: 'Erreur serveur' });
    }
}

// ==================== SUPER PMO PROMPT ====================
const SUPER_PMO_PROMPT = `Tu es Nzela, le Super PMO d'ARK Corporat Group au Congo-Brazzaville.

═══════════════════════════════════════════════════════════════
                    🎯 TA MISSION
═══════════════════════════════════════════════════════════════

Tu mènes un entretien de cadrage structuré pour collecter les informations 
nécessaires à la génération des 7 livrables PMO :

Documents client :
- Project Charter Client
- Cahier de charge
- Budget prévisionnel
- Plan de projet
- Checklist de lancement

Documents internes ARK :
- Project Charter ARK (avec scoring et recommandations)
- Matrice des risques

Tu GUIDES le client étape par étape. Il ne connaît rien au PMO, 
c'est TOI qui orientes la conversation.

═══════════════════════════════════════════════════════════════
                    🧭 TON RÔLE DE GUIDE
═══════════════════════════════════════════════════════════════

Tu ne poses JAMAIS de questions isolées. Tu GUIDES en permanence :

1. VALIDER — Reformuler ce que tu as compris
2. ORIENTER — Annoncer le thème qu'on aborde maintenant
3. GUIDER — Proposer des options claires (A/B/C/D) pour aider le client

Le client doit toujours savoir :
- Ce que tu as retenu ✓
- Où on en est dans le cadrage ✓
- Ce qu'on explore maintenant ✓
- Quelles sont ses options ✓

═══════════════════════════════════════════════════════════════
                    📋 10 THÉMATIQUES À COUVRIR
═══════════════════════════════════════════════════════════════

1. CONTEXTE — Situation actuelle, problème à résoudre, déclencheur
2. VISION PROJET — Nature de l'activité, concept, différenciation
3. OBJECTIFS — Résultats attendus, critères de succès mesurables
4. CIBLE COMMERCIALE — Clients visés, segment, zone géographique
5. CONCURRENCE — Acteurs existants, positionnement marché
6. MODÈLE ÉCONOMIQUE — Pricing, facturation, moyens de paiement
7. PÉRIMÈTRE — Ce qui est inclus, ce qui est hors scope
8. RESSOURCES — Équipe, local, équipements, budget
9. PARTIES PRENANTES — Associés, partenaires, décideurs impliqués
10. CONTRAINTES & RISQUES — Délais, freins, inquiétudes, blocages

═══════════════════════════════════════════════════════════════
                    🗣️ FORMAT DE RÉPONSE
═══════════════════════════════════════════════════════════════

STRUCTURE OBLIGATOIRE :
1. Synthèse (ce que tu as noté)
2. Transition (thème qu'on aborde maintenant)
3. Questions guidées avec options (jusqu'à 6 questions)

FORMAT :
"Noté : [synthèse courte].

Passons à [thème]. 
[Questions avec options A/B/C/D + demande de précision]"

═══════════════════════════════════════════════════════════════
                    💡 EXEMPLES
═══════════════════════════════════════════════════════════════

PREMIER MESSAGE (après description du projet) :

"Noté : [résumé du projet décrit].

Commençons par le contexte. Dans quelle situation ce projet naît-il ?
A) Une douleur terrain récurrente (problème opérationnel)
B) Une opportunité business (nouveau marché, nouvelle offre)
C) Une demande externe (partenaire, client, institution)
D) Une obligation (réglementaire, conformité)
E) Autre

Précise aussi : qu'est-ce qui déclenche le besoin maintenant ?"

---

MILIEU DE CONVERSATION :

"Noté : [résumé cible et positionnement].

Passons au modèle économique. Comment tu prévois de facturer ?
A) À l'unité / à la pièce
B) Au forfait / abonnement
C) Sur devis / par projet
D) Commission / pourcentage
E) Autre

Quels moyens de paiement tu acceptes ?
A) Cash uniquement
B) Mobile Money (MTN, Airtel)
C) Virement bancaire
D) Plusieurs options

Et tu as une idée de tes tarifs ou fourchette de prix ?"

---

AUTRE EXEMPLE :

"Bien noté.

Parlons ressources et organisation.
- Tu démarres seul ou avec une équipe ? Si équipe, combien de personnes ?
- Tu as déjà un local en vue ou c'est à trouver ?
- Quels équipements principaux tu dois acquérir ?
- Quel budget d'investissement initial tu projettes ?
  A) Moins de 5 millions FCFA
  B) Entre 5 et 15 millions FCFA
  C) Entre 15 et 30 millions FCFA
  D) Plus de 30 millions FCFA
  E) Pas encore défini"

---

DERNIÈRE THÉMATIQUE :

"OK, vision claire sur l'organisation.

Dernière partie : contraintes et risques.
- C'est quoi ton délai idéal de lancement ?
  A) Moins d'1 mois
  B) 1 à 3 mois
  C) 3 à 6 mois
  D) Plus de 6 mois

- Quels freins tu identifies aujourd'hui ?
  A) Financement pas bouclé
  B) Local pas trouvé
  C) Autorisations / administratif
  D) Recrutement / compétences
  E) Aucun frein majeur
  F) Autre

- C'est quoi ta plus grande inquiétude sur ce projet ?"

═══════════════════════════════════════════════════════════════
                    ❌ INTERDIT
═══════════════════════════════════════════════════════════════

- Questions isolées sans contexte
- Oublier de reformuler ce que tu as compris
- Ne pas annoncer le thème abordé
- Questions ouvertes sans options pour guider
- Ton trop familier ("Super !", "Génial !")
- Ton trop froid (rester pro mais accessible)

═══════════════════════════════════════════════════════════════
                    ⏰ FIN DE CADRAGE
═══════════════════════════════════════════════════════════════

Quand tu as couvert les 10 thématiques (généralement 5-7 échanges), termine ainsi :

[GENERATE]
Cadrage terminé. Voici ce que j'ai noté :
- Activité : [résumé]
- Cible : [résumé]
- Modèle économique : [résumé]
- Ressources : [résumé]
- Budget : [résumé]
- Délai : [résumé]
- Contraintes : [résumé]

Tu peux maintenant générer tes documents depuis le menu à gauche.`;
// ==================== HANDLE CHAT ====================
async function handleChat(res, message, history) {
    const historyText = history && history.length > 0 
        ? history.map(h => `${h.type === 'user' ? 'CLIENT' : 'NZELA'}: ${h.content}`).join('\n\n')
        : 'Premier message du client';

    const fullPrompt = `${SUPER_PMO_PROMPT}

═══════════════════════════════════════════════════════════════
                    📜 HISTORIQUE
═══════════════════════════════════════════════════════════════

${historyText}

═══════════════════════════════════════════════════════════════
                    ✉️ MESSAGE DU CLIENT
═══════════════════════════════════════════════════════════════

"${message}"

═══════════════════════════════════════════════════════════════

Réponds en 2 phrases max. Une question simple à la fin.
Si tu as assez d'infos, commence par [GENERATE].`;

    const response = await fetch('https://api.deepseek.com/v1/chat/completions', {
        method: 'POST',
        headers: { 
            'Content-Type': 'application/json', 
            'Authorization': `Bearer ${process.env.DEEPSEEK_API_KEY}` 
        },
        body: JSON.stringify({ 
            model: 'deepseek-chat', 
            messages: [{ role: 'user', content: fullPrompt }], 
            temperature: 0.7, 
            max_tokens: 150 
        })
    });

    if (!response.ok) throw new Error('API Error');
    
    const data = await response.json();
    const aiResponse = data.choices[0].message.content.trim();
    
    if (aiResponse.startsWith('[GENERATE]')) {
        const cleanResponse = aiResponse.replace('[GENERATE]', '').trim();
        return res.status(200).json({ 
            action: 'generate',
            response: cleanResponse
        });
    }
    
    return res.status(200).json({ 
        action: 'continue',
        response: aiResponse
    });
}

// ==================== PROMPTS DOCUMENTS ====================
const DOCUMENT_PROMPTS = {

// 1. PROJECT CHARTER CLIENT
charter_client: `Génère un PROJECT CHARTER CLIENT (version présentable au client).

STRUCTURE :

# PROJECT CHARTER
## [Nom du projet]

---

### 1. IDENTIFICATION
Projet : [nom]
Client : [nom ou "À définir"]
Date : ${new Date().toLocaleDateString('fr-FR')}

---

### 2. CONTEXTE
[Description de la situation actuelle et pourquoi ce projet]

---

### 3. OBJECTIFS
Objectif principal : [1-2 phrases]
Résultat attendu : [ce que le client veut obtenir]

---

### 4. DESCRIPTION DU PROJET
[Ce que le projet va faire / produire]

---

### 5. PÉRIMÈTRE

Ce qui est inclus :
- [élément 1]
- [élément 2]
- [etc.]

Ce qui n'est pas inclus :
- [élément 1]
- [élément 2]

---

### 6. CIBLE & MARCHÉ
Clientèle visée : [description]
Zone : [localisation]

---

### 7. ÉQUIPE PROJET
[Qui travaille sur le projet]

---

### 8. PLANNING PRÉVISIONNEL
Lancement souhaité : [date ou période]
Jalons clés : [si mentionnés]

---

### 9. BUDGET
Budget estimé : [montant ou "À définir"]

---

### 10. CONTRAINTES & RISQUES
Contraintes : [liste]
Risques identifiés : [liste]

---

Document préparé par Nzela - ARK Corporat Group`,

// 2. PROJECT CHARTER ARK (INTERNE)
charter_ark: `Génère un PROJECT CHARTER ARK (version interne avec scoring).

STRUCTURE :

# PROJECT CHARTER - DOCUMENT INTERNE ARK
## [Nom du projet]

---

### 📊 SCORING PROJET

| Critère | Score | Commentaire |
|---------|-------|-------------|
| Urgence | 🔴/🟡/🟢 | [justification] |
| Maturité client | 🔴/🟡/🟢 | [justification] |
| Complexité | 🔴/🟡/🟢 | [justification] |
| Potentiel | 🔴/🟡/🟢 | [justification] |

Score global : [Élevé / Moyen / Faible]

---

### 1. IDENTIFICATION
Projet : [nom]
Sponsor client : [nom ou "À identifier"]
Consultant ARK : [À assigner]
Date cadrage : ${new Date().toLocaleDateString('fr-FR')}

---

### 2. BUSINESS CASE

Contexte actuel :
[Situation du client]

Problème métier :
[Problème clairement formulé]

Justification :
[Pourquoi agir maintenant]

---

### 3. OBJECTIFS (SMART)

Objectif principal :
- [Objectif mesurable]

Critère de réussite :
- Le projet sera réussi si [condition mesurable]

---

### 4. PÉRIMÈTRE (SCOPE)

IN SCOPE :
- [inclus 1]
- [inclus 2]

OUT OF SCOPE :
- Conception détaillée
- Exécution opérationnelle
- [autres exclusions]

⚠️ Ce cadrage ne constitue pas un engagement d'exécution.

---

### 5. PARTIES PRENANTES

| Partie prenante | Rôle | Influence |
|-----------------|------|-----------|
| Client - Sponsor | Décision | Élevée |
| Client - Équipe | Contribution | Moyenne |
| ARK - Consultant | Cadrage | Élevée |

---

### 6. CONTRAINTES

- Budget : [montant ou "Non défini"]
- Délais : [date ou "Non défini"]
- Ressources : [contraintes]
- Réglementaire : [si applicable]

---

### 7. RISQUES IDENTIFIÉS

| Risque | Impact | Probabilité |
|--------|--------|-------------|
| [risque 1] | [impact] | [proba] |
| [risque 2] | [impact] | [proba] |

---

### 8. MATURITÉ CLIENT

| Domaine | Niveau |
|---------|--------|
| Organisation | Faible / Moyen / Élevé |
| Processus | Faible / Moyen / Élevé |
| Digital | Faible / Moyen / Élevé |
| Pilotage | Faible / Moyen / Élevé |

---

### 9. RECOMMANDATION ARK

☐ Diagnostic approfondi
☐ Mission de cadrage structurée  
☐ Offre opérationnelle ciblée
☐ Mise en attente / réorientation

Priorité : ☐ Faible ☐ Moyenne ☐ Élevée

Commentaire interne :
[Analyse et recommandation du consultant]

---

Document interne ARK Corporat Group - Confidentiel`,

// 3. CAHIER DE CHARGE
cahier_charge: `Génère un CAHIER DE CHARGE professionnel.

STRUCTURE :

# CAHIER DE CHARGE
## [Nom du projet]

---

### 1. PRÉSENTATION DU PROJET
Description : [2-3 phrases]
Objectif : [1-2 phrases]

---

### 2. CIBLE & MARCHÉ
Clientèle visée : [description]
Zone géographique : [localisation]

---

### 3. SERVICES / FONCTIONNALITÉS
[Liste détaillée des services ou fonctionnalités]

---

### 4. FONCTIONNEMENT
Parcours client : [étapes]
Moyens de paiement : [options]

---

### 5. ORGANISATION
Équipe : [structure]
Outils nécessaires : [liste]

---

### 6. BUDGET & PLANNING
Budget estimé : [montant ou "À définir"]
Délai : [date ou "À définir"]

---

### 7. RECOMMANDATIONS
[2-3 conseils]

---

Document généré par Nzela - ARK Corporat Group`,

// 4. BUDGET PRÉVISIONNEL
budget: `Génère un BUDGET PRÉVISIONNEL.

STRUCTURE :

# BUDGET PRÉVISIONNEL
## [Nom du projet]

---

### 1. INVESTISSEMENTS INITIAUX

| Poste | Montant (FCFA) |
|-------|----------------|
| Équipements | [montant] |
| Aménagements | [montant] |
| Frais administratifs | [montant] |
| Stock initial | [montant] |
| Divers | [montant] |

**TOTAL INVESTISSEMENTS : [montant] FCFA**

---

### 2. CHARGES MENSUELLES

| Poste | Montant (FCFA) |
|-------|----------------|
| Loyer | [montant] |
| Salaires | [montant] |
| Électricité/Eau | [montant] |
| Internet/Téléphone | [montant] |
| Fournitures | [montant] |
| Divers | [montant] |

**TOTAL CHARGES : [montant] FCFA/mois**

---

### 3. PRÉVISIONS DE REVENUS

Hypothèse basse : [montant] FCFA/mois
Hypothèse moyenne : [montant] FCFA/mois
Hypothèse haute : [montant] FCFA/mois

---

### 4. POINT MORT
CA minimum pour couvrir les charges : [montant] FCFA/mois

---

### 5. RECOMMANDATIONS
[Conseils financiers]

---

Document généré par Nzela - ARK Corporat Group`,

// 5. PLAN DE PROJET
plan_projet: `Génère un PLAN DE PROJET.

STRUCTURE :

# PLAN DE PROJET
## [Nom du projet]

---

### PHASE 1 : PRÉPARATION (Semaines 1-4)

Semaine 1-2 :
- [ ] [Tâche]
- [ ] [Tâche]

Semaine 3-4 :
- [ ] [Tâche]
- [ ] [Tâche]

---

### PHASE 2 : MISE EN PLACE (Semaines 5-8)

Semaine 5-6 :
- [ ] [Tâche]
- [ ] [Tâche]

Semaine 7-8 :
- [ ] [Tâche]
- [ ] [Tâche]

---

### PHASE 3 : LANCEMENT (Semaines 9-10)

- [ ] [Tâche]
- [ ] [Tâche]
- [ ] Ouverture officielle

---

### PHASE 4 : SUIVI (Semaines 11-12)

- [ ] [Tâche]
- [ ] [Tâche]

---

### JALONS CLÉS

| Jalon | Date | Responsable |
|-------|------|-------------|
| [Jalon 1] | Sem. X | [Qui] |
| [Jalon 2] | Sem. X | [Qui] |

---

Document généré par Nzela - ARK Corporat Group`,

// 6. MATRICE DES RISQUES
risques: `Génère une MATRICE DES RISQUES.

STRUCTURE :

# MATRICE DES RISQUES
## [Nom du projet]

---

### RISQUES ÉLEVÉS 🔴

**Risque : [Nom]**
- Probabilité : Élevée
- Impact : Élevé
- Description : [Détail]
- Mitigation : [Comment réduire]
- Plan B : [Si ça arrive]

---

### RISQUES MOYENS 🟡

**Risque : [Nom]**
- Probabilité : Moyenne
- Impact : Moyen
- Mitigation : [Comment réduire]

---

### RISQUES FAIBLES 🟢

**Risque : [Nom]**
- Probabilité : Faible
- Impact : Faible

---

### RISQUES LOCAUX (Congo-Brazzaville)

- Coupures électriques : [mitigation]
- [Autre risque local] : [mitigation]

---

### PLAN DE CONTINGENCE
[Recommandations générales]

---

Document généré par Nzela - ARK Corporat Group`,

// 7. CHECKLIST DE LANCEMENT
checklist: `Génère une CHECKLIST DE LANCEMENT.

STRUCTURE :

# CHECKLIST DE LANCEMENT
## [Nom du projet]

---

### ✅ ADMINISTRATIF & JURIDIQUE
- [ ] Immatriculation entreprise
- [ ] Numéro contribuable
- [ ] Registre de commerce
- [ ] Autorisation d'exercice
- [ ] Contrat de bail
- [ ] Assurance
- [ ] Compte bancaire pro

---

### ✅ LOCAL & ÉQUIPEMENTS
- [ ] Local validé
- [ ] Travaux terminés
- [ ] Équipements installés
- [ ] Électricité OK
- [ ] Internet OK
- [ ] Enseigne installée

---

### ✅ RESSOURCES HUMAINES
- [ ] Postes définis
- [ ] Recrutement fait
- [ ] Formation effectuée
- [ ] Contrats signés

---

### ✅ COMMERCIAL & MARKETING
- [ ] Tarifs définis
- [ ] Supports com prêts
- [ ] Réseaux sociaux créés
- [ ] WhatsApp Business
- [ ] Stock initial

---

### ✅ FINANCIER
- [ ] Budget validé
- [ ] Financement sécurisé
- [ ] Mobile Money activé
- [ ] Système facturation

---

### ✅ JOUR J
- [ ] Test équipements
- [ ] Équipe briefée
- [ ] Stock vérifié
- [ ] Communication lancement
- [ ] Premiers clients !

---

Document généré par Nzela - ARK Corporat Group`
};

// ==================== HANDLE GENERATE ====================
async function handleGenerate(res, history, docType = 'cahier_charge') {
    const conversationText = history.map(h => 
        `${h.type === 'user' ? 'CLIENT' : 'CONSULTANT'}: ${h.content}`
    ).join('\n\n');

    const docPrompt = DOCUMENT_PROMPTS[docType] || DOCUMENT_PROMPTS.cahier_charge;

    const generatePrompt = `Tu es un expert en gestion de projet PMI.

CONVERSATION AVEC LE CLIENT :
═══════════════════════════════════════════════════════════════
${conversationText}
═══════════════════════════════════════════════════════════════

MISSION :
${docPrompt}

RÈGLES :
- Base-toi UNIQUEMENT sur la conversation
- Si info manquante → "À définir"
- Style professionnel et clair
- Adapté au contexte Congo-Brazzaville (Mobile Money, FCFA)
- Pas de blabla, que du concret`;

    const response = await fetch('https://api.deepseek.com/v1/chat/completions', {
        method: 'POST',
        headers: { 
            'Content-Type': 'application/json', 
            'Authorization': `Bearer ${process.env.DEEPSEEK_API_KEY}` 
        },
        body: JSON.stringify({ 
            model: 'deepseek-chat', 
            messages: [{ role: 'user', content: generatePrompt }], 
            temperature: 0.7, 
            max_tokens: 3500 
        })
    });

    if (!response.ok) throw new Error('API Error');
    
    const data = await response.json();
    const document = data.choices[0].message.content.trim();
    
    return res.status(200).json({ 
        success: true,
        document: document
    });
}
