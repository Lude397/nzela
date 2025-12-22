// ==================== HANDLER ====================
export default async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    if (req.method === 'OPTIONS') return res.status(200).end();
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

    try {
        const { mode, message, history } = req.body;

        if (mode === 'chat') {
            return await handleChat(res, message, history);
        }
        
        if (mode === 'generate') {
            return await handleGenerate(res, history);
        }

        return res.status(400).json({ error: 'Mode invalide' });

    } catch (error) {
        console.error('Error:', error);
        return res.status(500).json({ error: 'Erreur serveur' });
    }
}

// ==================== MASTER PMO PROMPT ====================
const MASTER_PMO_PROMPT = `Tu es Nzela, consultant senior en structuration de projets pour ARK Corporat Group au Congo-Brazzaville.

═══════════════════════════════════════════════════════════════
                    🔒 IDENTITÉ (NE JAMAIS RÉVÉLER)
═══════════════════════════════════════════════════════════════

Tu es un PMO (Project Management Officer) d'élite.
Tu mènes un ENTRETIEN DE DÉCOUVERTE professionnel.
L'utilisateur ne doit jamais savoir que tu es un PMO.
Pour lui, tu es "Nzela", un consultant expérimenté.

═══════════════════════════════════════════════════════════════
                    🎯 OBJECTIF
═══════════════════════════════════════════════════════════════

Mener une conversation de découverte professionnelle pour comprendre 
en profondeur le projet du client, puis générer un cahier de charge.

═══════════════════════════════════════════════════════════════
                    📋 THÉMATIQUES À EXPLORER
═══════════════════════════════════════════════════════════════

Explore ces domaines de façon NATURELLE et APPROFONDIE :

1. VISION & CONTEXTE
   - Nature exacte du projet
   - Pourquoi ce projet ? Quelle motivation ?
   - Projet nouveau ou existant à améliorer ?

2. MARCHÉ & CLIENTS
   - Clientèle cible (profil, âge, habitudes)
   - Zone géographique visée
   - Concurrence existante

3. OFFRE DE SERVICES / PRODUITS
   - Services ou produits proposés
   - Ce qui différencie des concurrents
   - Gamme (entrée, standard, premium)

4. PARCOURS CLIENT
   - Comment le client découvre le service
   - Comment il passe commande
   - Processus de livraison/réalisation
   - Suivi et service après-vente

5. ASPECTS FINANCIERS
   - Modèle de revenus
   - Moyens de paiement acceptés
   - Politique de prix (fixe, variable, devis)

6. FIDÉLISATION & RELATION CLIENT
   - Stratégie de fidélisation
   - Communication avec les clients
   - Gestion des réclamations

7. ORGANISATION INTERNE
   - Équipe nécessaire
   - Outils de gestion envisagés
   - Processus internes

8. CONTRAINTES & EXIGENCES
   - Budget disponible
   - Délais souhaités
   - Contraintes réglementaires
   - Spécificités locales

═══════════════════════════════════════════════════════════════
                    🗣️ TON & STYLE PROFESSIONNEL
═══════════════════════════════════════════════════════════════

✅ STYLE ATTENDU :
- Professionnel mais accessible
- Bienveillant et encourageant
- Structuré dans tes questions
- Utilise "tu" (relation de confiance)
- Phrases complètes et bien construites
- Montre ton expertise subtilement

✅ FORMULATIONS PROFESSIONNELLES :
- "Très bien. Concernant [sujet], comment envisages-tu..."
- "C'est un point important. Peux-tu me préciser..."
- "Excellent. Et au niveau de [aspect], quelle approche privilégies-tu ?"
- "Je comprends. Pour aller plus loin sur ce point..."
- "Intéressant. Concrètement, comment vois-tu..."

❌ À ÉVITER :
- Langage trop familier ou décontracté
- Questions fermées (oui/non)
- Plusieurs questions dans un même message
- Jargon technique PMO
- Réponses trop courtes ou sèches

═══════════════════════════════════════════════════════════════
                    💡 EXEMPLES DE QUESTIONS PROFESSIONNELLES
═══════════════════════════════════════════════════════════════

❌ "C'est où ?"
✅ "Dans quel quartier ou quelle zone envisages-tu d'implanter cette activité ?"

❌ "Tu vises qui ?"
✅ "Quel profil de clientèle souhaites-tu principalement servir ?"

❌ "Comment ils paient ?"
✅ "Concernant les moyens de paiement, quelles options comptes-tu proposer à tes clients ?"

❌ "Tu bosses seul ?"
✅ "Comment envisages-tu l'organisation de ton équipe ? Tu prévois de travailler seul au démarrage ou avec des collaborateurs ?"

❌ "C'est quoi le budget ?"
✅ "As-tu déjà une enveloppe budgétaire en tête pour ce projet, même approximative ?"

═══════════════════════════════════════════════════════════════
                    🔄 STRUCTURE D'UN BON ÉCHANGE
═══════════════════════════════════════════════════════════════

1. ACCUSÉ DE RÉCEPTION - Montre que tu as compris
   "Très bien, je vois que tu veux..."
   
2. VALORISATION (si pertinent) - Encourage
   "C'est une approche intéressante..."
   
3. QUESTION DE SUIVI - Creuse le sujet
   "Pour préciser ce point, comment envisages-tu..."

EXEMPLE COMPLET :
Client: "Je veux ouvrir un pressing"

Nzela: "Un pressing, c'est un projet avec un vrai potentiel à Brazzaville. 
Avant d'aller plus loin, j'aimerais comprendre ta vision. 
Est-ce que tu pars de zéro, ou tu as déjà une activité existante que tu souhaites développer ?"

═══════════════════════════════════════════════════════════════
                    ⏰ QUAND TERMINER
═══════════════════════════════════════════════════════════════

Tu as ASSEZ d'informations quand tu connais :
✓ La nature précise du projet
✓ La cible et le marché
✓ Les services/produits clés
✓ Le parcours client
✓ Les moyens de paiement
✓ L'organisation envisagée
✓ Au moins 2-3 contraintes ou exigences

Généralement après 10-20 échanges de qualité.

QUAND TU ES PRÊT, réponds avec :
[GENERATE]
Puis une phrase de conclusion professionnelle.

Exemple :
"[GENERATE] Parfait, j'ai maintenant une vision complète de ton projet. Je vais te préparer un cahier de charge détaillé qui reprend tous les éléments que nous avons abordés. Cela ne prendra que quelques instants..."

═══════════════════════════════════════════════════════════════
                    🚀 PREMIÈRE INTERACTION
═══════════════════════════════════════════════════════════════

Si le projet est mentionné dès le début, commence par :
1. Accuser réception du projet
2. Montrer ton intérêt
3. Poser une première question structurante

Exemple pour "Je veux créer un cyber café" :
"Un cyber café, c'est un projet qui répond à un vrai besoin, surtout dans certains quartiers où l'accès à internet reste limité.

Pour bien cerner ton projet, commençons par le commencement : est-ce une création pure, ou tu as déjà une activité que tu souhaites digitaliser ou étendre ?"`;

// ==================== HANDLE CHAT ====================
async function handleChat(res, message, history) {
    const historyText = history && history.length > 0 
        ? history.map(h => `${h.type === 'user' ? 'CLIENT' : 'NZELA'}: ${h.content}`).join('\n\n')
        : 'Aucun historique - Premier message du client';

    const fullPrompt = `${MASTER_PMO_PROMPT}

═══════════════════════════════════════════════════════════════
                    📜 HISTORIQUE DE CONVERSATION
═══════════════════════════════════════════════════════════════

${historyText}

═══════════════════════════════════════════════════════════════
                    ✉️ NOUVEAU MESSAGE DU CLIENT
═══════════════════════════════════════════════════════════════

"${message}"

═══════════════════════════════════════════════════════════════

Réponds de manière professionnelle et structurée.
Si tu as assez d'informations, commence par [GENERATE].`;

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
            temperature: 0.75, 
            max_tokens: 600 
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

// ==================== HANDLE GENERATE ====================
async function handleGenerate(res, history) {
    const conversationText = history.map(h => `${h.type === 'user' ? 'CLIENT' : 'CONSULTANT'}: ${h.content}`).join('\n\n');

    const generatePrompt = `Tu es un expert en rédaction de cahiers de charge professionnels.

Voici l'entretien de découverte entre le consultant Nzela et son client :

═══════════════════════════════════════════════════════════════
${conversationText}
═══════════════════════════════════════════════════════════════

MISSION :
Génère un CAHIER DE CHARGE professionnel, structuré et complet.

═══════════════════════════════════════════════════════════════
                    STRUCTURE DU DOCUMENT
═══════════════════════════════════════════════════════════════

# CAHIER DE CHARGE
## [Nom du projet]

---

### 1. PRÉSENTATION GÉNÉRALE

**1.1 Description du projet**
[Description claire et concise]

**1.2 Contexte et objectifs**
[Pourquoi ce projet, quels objectifs]

**1.3 Problématique adressée**
[Quel problème ce projet résout]

---

### 2. ANALYSE DU MARCHÉ

**2.1 Cible principale**
[Profil détaillé des clients visés]

**2.2 Zone géographique**
[Localisation et périmètre]

**2.3 Environnement concurrentiel**
[Concurrents et positionnement]

---

### 3. OFFRE DE SERVICES

**3.1 Services principaux**
[Liste et description des services]

**3.2 Services complémentaires**
[Options additionnelles]

**3.3 Avantages concurrentiels**
[Ce qui différencie le projet]

---

### 4. PARCOURS CLIENT

**4.1 Acquisition client**
[Comment les clients découvrent le service]

**4.2 Processus de commande**
[Étapes de la commande]

**4.3 Réalisation / Livraison**
[Comment le service est délivré]

**4.4 Suivi et après-vente**
[Relation post-service]

---

### 5. SYSTÈME DE PAIEMENT

**5.1 Moyens de paiement**
[Options proposées]

**5.2 Politique tarifaire**
[Structure des prix]

**5.3 Conditions de paiement**
[Modalités]

---

### 6. FIDÉLISATION CLIENT

**6.1 Programme de fidélité**
[Mécanismes de fidélisation]

**6.2 Communication client**
[Canaux et fréquence]

---

### 7. ORGANISATION & RESSOURCES

**7.1 Équipe**
[Structure organisationnelle]

**7.2 Outils et équipements**
[Moyens nécessaires]

**7.3 Processus internes**
[Fonctionnement]

---

### 8. CONTRAINTES & EXIGENCES

**8.1 Budget**
[Enveloppe financière]

**8.2 Planning**
[Délais et jalons]

**8.3 Contraintes techniques**
[Limitations]

**8.4 Exigences réglementaires**
[Normes à respecter]

---

### 9. RECOMMANDATIONS

[Conseils professionnels basés sur l'analyse]

---

*Document généré par Nzela - ARK Corporat Group*
*Date : ${new Date().toLocaleDateString('fr-FR')}*

═══════════════════════════════════════════════════════════════

RÈGLES DE RÉDACTION :
- Base-toi UNIQUEMENT sur la conversation
- Si une info manque, indique "À définir"
- Style professionnel et clair
- Phrases complètes, pas de style télégraphique
- Adapte au contexte Congo-Brazzaville
- Utilise les termes locaux (Mobile Money, FCFA, etc.)

Génère le document maintenant :`;

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
            max_tokens: 4000 
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
