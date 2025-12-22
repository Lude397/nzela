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

// ==================== MASTER PMO PROMPT ====================
const MASTER_PMO_PROMPT = `Tu es Nzela, consultant en structuration de projets pour ARK Corporat Group au Congo-Brazzaville.

═══════════════════════════════════════════════════════════════
                    🎯 TON STYLE
═══════════════════════════════════════════════════════════════

Tu es CONCIS et PROFESSIONNEL.
- Maximum 2 phrases par réponse
- Première phrase : constat ou validation courte
- Deuxième phrase : UNE question directe

EXEMPLES DE TON STYLE :

User: "Je veux créer une société de transport"
✅ "Transport urbain à Brazzaville, c'est un secteur porteur. Quel type de service envisages-tu : lignes régulières ou transport à la demande ?"

User: "Je veux ouvrir un pressing"
✅ "Le pressing, c'est un service très demandé. Tu cibles les particuliers, les entreprises, ou les deux ?"

User: "Les particuliers surtout"
✅ "Noté. Tu prévois un service de collecte à domicile ou le client vient déposer sur place ?"

═══════════════════════════════════════════════════════════════
                    ❌ CE QU'IL NE FAUT JAMAIS FAIRE
═══════════════════════════════════════════════════════════════

JAMAIS :
- "Excellent !", "Super !", "Génial !" → Trop enthousiaste
- Paragraphes longs → Maximum 2 phrases
- Plusieurs questions → UNE seule question
- Répéter ce que le client a dit → Aller droit au but
- "J'aimerais comprendre...", "Pour bien cerner..." → Trop verbeux
- Listes à puces ou gras → Texte simple

═══════════════════════════════════════════════════════════════
                    📋 THÉMATIQUES À EXPLORER
═══════════════════════════════════════════════════════════════

Explore ces sujets UN PAR UN :

1. Type de projet exact
2. Cible (particuliers, entreprises, les deux)
3. Zone géographique
4. Services proposés
5. Mode de fonctionnement (parcours client)
6. Moyens de paiement
7. Équipe prévue
8. Budget approximatif
9. Délai de lancement

═══════════════════════════════════════════════════════════════
                    ⏰ QUAND TERMINER
═══════════════════════════════════════════════════════════════

Après 8-12 échanges, quand tu as couvert les points essentiels :

[GENERATE]
Bien, j'ai les éléments clés. Je te prépare le cahier de charge.`;

// ==================== HANDLE CHAT ====================
async function handleChat(res, message, history) {
    const historyText = history && history.length > 0 
        ? history.map(h => `${h.type === 'user' ? 'CLIENT' : 'NZELA'}: ${h.content}`).join('\n\n')
        : 'Premier message du client';

    const fullPrompt = `${MASTER_PMO_PROMPT}

═══════════════════════════════════════════════════════════════
                    📜 HISTORIQUE
═══════════════════════════════════════════════════════════════

${historyText}

═══════════════════════════════════════════════════════════════
                    ✉️ MESSAGE DU CLIENT
═══════════════════════════════════════════════════════════════

"${message}"

═══════════════════════════════════════════════════════════════

Réponds en 2 phrases maximum. Une question à la fin.
Si tu as assez d'infos (8-12 échanges), commence par [GENERATE].`;

    const response = await fetch('https://api.deepseek.com/v1/chat/completions', {
        method: 'POST',
        headers: { 
            'Content-Type': 'application/json', 
            'Authorization': `Bearer ${process.env.DEEPSEEK_API_KEY}` 
        },
        body: JSON.stringify({ 
            model: 'deepseek-chat', 
            messages: [
                { role: 'user', content: fullPrompt }
            ], 
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

// ==================== PROMPTS PAR TYPE DE DOCUMENT ====================
const DOCUMENT_PROMPTS = {
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

### 3. SERVICES PROPOSÉS
[Liste des services identifiés]

---

### 4. FONCTIONNEMENT
Parcours client : [étapes]
Moyens de paiement : [options]

---

### 5. ORGANISATION
Équipe : [structure prévue]
Outils nécessaires : [liste]

---

### 6. BUDGET & PLANNING
Budget estimé : [montant ou "À définir"]
Délai de lancement : [date ou "À définir"]

---

### 7. RECOMMANDATIONS
[2-3 conseils professionnels]

---

Document généré par Nzela - ARK Corporat Group`,

    budget: `Génère un BUDGET PRÉVISIONNEL professionnel.

STRUCTURE :

# BUDGET PRÉVISIONNEL
## [Nom du projet]

---

### 1. INVESTISSEMENTS INITIAUX

#### Équipements
[Liste avec prix estimés en FCFA]

#### Aménagements
[Liste avec prix estimés]

#### Frais administratifs
[Licences, immatriculation, etc.]

TOTAL INVESTISSEMENTS : [montant] FCFA

---

### 2. CHARGES MENSUELLES

#### Charges fixes
- Loyer : [montant] FCFA
- Salaires : [montant] FCFA
- Électricité/Eau : [montant] FCFA
- Internet/Téléphone : [montant] FCFA
- Autres : [montant] FCFA

TOTAL CHARGES FIXES : [montant] FCFA/mois

#### Charges variables
[Liste avec estimations]

---

### 3. PRÉVISIONS DE REVENUS

#### Hypothèse basse
[Calcul détaillé]

#### Hypothèse moyenne
[Calcul détaillé]

#### Hypothèse haute
[Calcul détaillé]

---

### 4. POINT MORT
Chiffre d'affaires minimum pour couvrir les charges : [montant] FCFA/mois

---

### 5. RECOMMANDATIONS FINANCIÈRES
[2-3 conseils]

---

Document généré par Nzela - ARK Corporat Group`,

    plan_projet: `Génère un PLAN DE PROJET professionnel.

STRUCTURE :

# PLAN DE PROJET
## [Nom du projet]

---

### PHASE 1 : PRÉPARATION (Semaines 1-4)

#### Semaine 1-2
- [ ] [Tâche 1]
- [ ] [Tâche 2]
- [ ] [Tâche 3]

#### Semaine 3-4
- [ ] [Tâche 4]
- [ ] [Tâche 5]

Livrable : [ce qui doit être prêt]

---

### PHASE 2 : MISE EN PLACE (Semaines 5-8)

#### Semaine 5-6
- [ ] [Tâche]
- [ ] [Tâche]

#### Semaine 7-8
- [ ] [Tâche]
- [ ] [Tâche]

Livrable : [ce qui doit être prêt]

---

### PHASE 3 : LANCEMENT (Semaines 9-10)

- [ ] [Tâche]
- [ ] [Tâche]
- [ ] [Tâche]

Livrable : Ouverture officielle

---

### PHASE 4 : SUIVI (Semaines 11-12)

- [ ] [Tâche]
- [ ] [Tâche]

---

### JALONS CLÉS

| Jalon | Date | Responsable |
|-------|------|-------------|
| [Jalon 1] | Semaine X | [Qui] |
| [Jalon 2] | Semaine X | [Qui] |
| [Jalon 3] | Semaine X | [Qui] |

---

Document généré par Nzela - ARK Corporat Group`,

    risques: `Génère une MATRICE DES RISQUES professionnelle.

STRUCTURE :

# MATRICE DES RISQUES
## [Nom du projet]

---

### RISQUES ÉLEVÉS (Action immédiate requise)

#### Risque 1 : [Nom du risque]
- Probabilité : Élevée
- Impact : Élevé
- Description : [Détail]
- Mitigation : [Comment réduire ce risque]
- Plan B : [Si le risque se réalise]

#### Risque 2 : [Nom du risque]
[Même structure]

---

### RISQUES MOYENS (À surveiller)

#### Risque 3 : [Nom du risque]
- Probabilité : Moyenne
- Impact : Moyen
- Description : [Détail]
- Mitigation : [Comment réduire]

---

### RISQUES FAIBLES (À noter)

#### Risque 4 : [Nom du risque]
- Probabilité : Faible
- Impact : Faible
- Description : [Détail]

---

### RISQUES SPÉCIFIQUES AU CONGO

- [Risque local 1 : coupures électricité, etc.]
- [Risque local 2]
- [Risque local 3]

---

### PLAN DE CONTINGENCE GLOBAL
[Recommandations générales pour gérer les imprévus]

---

Document généré par Nzela - ARK Corporat Group`,

    checklist: `Génère une CHECKLIST DE LANCEMENT professionnelle.

STRUCTURE :

# CHECKLIST DE LANCEMENT
## [Nom du projet]

---

### ADMINISTRATIF & JURIDIQUE
- [ ] Immatriculation de l'entreprise
- [ ] Numéro contribuable
- [ ] Registre de commerce
- [ ] Autorisation d'exercice (si nécessaire)
- [ ] Contrat de bail signé
- [ ] Assurance professionnelle
- [ ] Compte bancaire professionnel

---

### LOCAL & ÉQUIPEMENTS
- [ ] Local identifié et validé
- [ ] Travaux d'aménagement terminés
- [ ] Équipements achetés et installés
- [ ] Connexion électrique OK
- [ ] Connexion internet OK
- [ ] Enseigne installée

---

### RESSOURCES HUMAINES
- [ ] Postes définis
- [ ] Recrutement effectué
- [ ] Formation du personnel
- [ ] Contrats de travail signés

---

### COMMERCIAL & MARKETING
- [ ] Tarifs définis
- [ ] Supports de communication prêts
- [ ] Réseaux sociaux créés
- [ ] Numéro WhatsApp Business
- [ ] Premier stock / fournitures

---

### FINANCIER
- [ ] Budget validé
- [ ] Financement sécurisé
- [ ] Système de paiement Mobile Money
- [ ] Caisse / système de facturation

---

### JOUR J - OUVERTURE
- [ ] Test général de tous les équipements
- [ ] Équipe briefée
- [ ] Stock vérifié
- [ ] Communication de lancement envoyée
- [ ] Premiers clients accueillis !

---

### APRÈS L'OUVERTURE (Semaine 1)
- [ ] Collecter les retours clients
- [ ] Ajuster si nécessaire
- [ ] Suivi des ventes
- [ ] Premier bilan

---

Document généré par Nzela - ARK Corporat Group`
};

// ==================== HANDLE GENERATE ====================
async function handleGenerate(res, history, docType = 'cahier_charge') {
    const conversationText = history.map(h => `${h.type === 'user' ? 'CLIENT' : 'CONSULTANT'}: ${h.content}`).join('\n\n');

    const docPrompt = DOCUMENT_PROMPTS[docType] || DOCUMENT_PROMPTS.cahier_charge;

    const generatePrompt = `Tu es un expert en gestion de projet.

CONVERSATION AVEC LE CLIENT :
═══════════════════════════════════════════════════════════════
${conversationText}
═══════════════════════════════════════════════════════════════

MISSION :
${docPrompt}

RÈGLES :
- Base-toi UNIQUEMENT sur la conversation
- Si info manquante → "À définir"
- Style clair et professionnel
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
            messages: [
                { role: 'user', content: generatePrompt }
            ], 
            temperature: 0.7, 
            max_tokens: 3000 
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
