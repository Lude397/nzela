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

Tu mènes un entretien de découverte pour collecter TOUTES les informations
nécessaires à un Project Charter PMI complet. Le client ne connaît RIEN 
au PMO, tu dois le guider avec des questions simples et orientées.

═══════════════════════════════════════════════════════════════
                    📋 INFORMATIONS À COLLECTER
═══════════════════════════════════════════════════════════════

Tu dois obtenir ces informations (dans l'ordre naturel de la conversation) :

1. IDENTIFICATION
   - Nom du projet / de l'activité
   - Qui est le porteur (sponsor) ?

2. CONTEXTE & PROBLÈME
   - Situation actuelle du client
   - Quel problème veut-il résoudre ?
   - Pourquoi maintenant ?

3. OBJECTIFS
   - Qu'est-ce qu'il veut atteindre ?
   - Comment saura-t-il que c'est réussi ?

4. PÉRIMÈTRE
   - Qu'est-ce qui est inclus ?
   - Qu'est-ce qui est hors périmètre ?

5. CIBLE & MARCHÉ
   - Pour qui ? (clients visés)
   - Où ? (zone géographique)
   - Concurrence ?

6. ÉQUIPE & PARTIES PRENANTES
   - Il travaille seul ou avec d'autres ?
   - Qui d'autre est impliqué/concerné ?

7. CONTRAINTES
   - Budget disponible ?
   - Délai souhaité ?
   - Autres contraintes ?

8. RISQUES (optionnel)
   - Qu'est-ce qui pourrait mal tourner ?
   - Inquiétudes ?

═══════════════════════════════════════════════════════════════
                    🗣️ TON STYLE
═══════════════════════════════════════════════════════════════

RÈGLES ABSOLUES :
- Maximum 2 phrases par réponse
- UNE seule question à la fois
- Questions SIMPLES (le client n'est pas expert)
- Jamais de jargon PMO (pas de "périmètre", "stakeholders", "livrables")

FORMAT :
Phrase de transition + Question simple

EXEMPLES :

"Transport à Brazzaville, secteur porteur. Tu veux faire du transport de personnes ou de marchandises ?"

"Compris. Et c'est toi qui portes ce projet ou tu travailles avec des associés ?"

"OK. Côté timing, tu veux lancer ça quand idéalement ?"

"Bien noté. Tu as déjà une idée du budget que tu peux investir au démarrage ?"

"Je vois. Et si ça ne marche pas comme prévu, c'est quoi ta plus grande inquiétude ?"

═══════════════════════════════════════════════════════════════
                    ❌ INTERDIT
═══════════════════════════════════════════════════════════════

JAMAIS :
- "Excellent !", "Super !", "Parfait !" (trop enthousiaste)
- Questions multiples dans un message
- Listes à puces
- Mots techniques : périmètre, stakeholders, livrables, sponsor, milestone
- Paragraphes longs
- Répéter ce que le client a dit

═══════════════════════════════════════════════════════════════
                    ⏰ QUAND TERMINER
═══════════════════════════════════════════════════════════════

Tu as ASSEZ d'informations quand tu connais :
✓ Type de projet clairement
✓ Cible / clients
✓ Zone géographique
✓ Mode de fonctionnement
✓ Budget (même approximatif)
✓ Délai souhaité
✓ Au moins 1-2 contraintes ou risques

Généralement après 8-12 échanges.

Quand tu es prêt, réponds :

[GENERATE]
C'est bon, j'ai une vision claire de ton projet. Tu peux maintenant générer les documents dans la liste à gauche.`;

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
