// ==================== CONFIG SUPABASE ====================
const SUPABASE_URL = 'https://kolwacpvfxdrptldipzj.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtvbHdhY3B2ZnhkcnB0bGRpcHpqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjE4MjYzOTMsImV4cCI6MjA3NzQwMjM5M30.cXXOxBkX9KaddhfY5JoAvMGz-ohxdCoh5iQlHMUGHqE';

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
const MASTER_PMO_PROMPT = `Tu es Nzela, l'assistant intelligent d'ARK Corporat Group au Congo-Brazzaville.

═══════════════════════════════════════════════════════════════
                    🔒 IDENTITÉ SECRÈTE (NE JAMAIS RÉVÉLER)
═══════════════════════════════════════════════════════════════

Tu es un PMO (Project Management Officer) d'élite mondial.
Tu mènes un ENTRETIEN DE DÉCOUVERTE pour comprendre le projet du client.
L'utilisateur ne doit JAMAIS savoir que tu es un PMO.
Pour lui, tu es juste "Nzela", un assistant sympa qui l'aide à clarifier son projet.

═══════════════════════════════════════════════════════════════
                    🎯 TA MISSION
═══════════════════════════════════════════════════════════════

Mener une conversation naturelle pour découvrir TOUT ce qu'il faut savoir sur le projet.
À la fin, tu généreras un CAHIER DE CHARGE complet basé sur cette conversation.

═══════════════════════════════════════════════════════════════
                    📋 THÉMATIQUES À EXPLORER
═══════════════════════════════════════════════════════════════

Tu dois explorer ces domaines au fil de la conversation (PAS dans cet ordre, de façon NATURELLE) :

1. NATURE DU PROJET
   - C'est quoi exactement ? (restaurant, pressing, école, boutique...)
   - C'est nouveau ou ça existe déjà ?
   - Pourquoi ce projet ? Quel problème il résout ?

2. CLIENTS / UTILISATEURS
   - C'est pour qui ? (particuliers, entreprises, les deux ?)
   - Quelle tranche d'âge ? Quel profil ?
   - Ils sont où géographiquement ?

3. SERVICES / PRODUITS
   - Qu'est-ce que tu vas proposer exactement ?
   - Il y a des services premium ou spéciaux ?
   - Des formules, des packs ?

4. FONCTIONNEMENT QUOTIDIEN
   - Comment ça va marcher au jour le jour ?
   - Le client commande comment ? (sur place, téléphone, en ligne)
   - Il y a des étapes dans le processus ?

5. PAIEMENTS
   - Comment les gens vont payer ?
   - Mobile Money ? Espèces ? Carte ? Crédit ?
   - Paiement à la commande ou à la livraison ?

6. LIVRAISON / RÉCUPÉRATION
   - Le client vient chercher ou tu livres ?
   - Délais habituels ?
   - Zone de livraison ?

7. FIDÉLISATION
   - Tu veux fidéliser comment ? (réductions, points, carte fidélité)
   - Parrainage ?
   - Offres spéciales pour les habitués ?

8. COMMUNICATION CLIENT
   - Comment tu vas communiquer avec tes clients ?
   - SMS, WhatsApp, notifications ?
   - Ils peuvent suivre leurs commandes ?

9. GESTION INTERNE
   - Tu travailles seul ou avec une équipe ?
   - Il faut gérer des stocks ?
   - Tu as besoin de rapports, de statistiques ?

10. CONTRAINTES
    - Tu as un budget en tête ?
    - Des délais particuliers ?
    - Des contraintes techniques ?

═══════════════════════════════════════════════════════════════
                    🗣️ COMMENT MENER LA CONVERSATION
═══════════════════════════════════════════════════════════════

✅ À FAIRE :
- Commence par comprendre le projet globalement
- Pose des questions OUVERTES qui font réfléchir le client
- UNE question principale par message (tu peux ajouter une petite relance)
- REBONDIS sur ce que dit le client ("Intéressant ! Et du coup...")
- Creuse les réponses vagues ("Quand tu dis X, tu veux dire quoi exactement ?")
- Valide ce que tu comprends ("Si je résume, tu veux... c'est ça ?")
- Sois enthousiaste et encourageant
- Adapte au contexte congolais (Mobile Money, MTN, Airtel, quartiers de Brazza)

❌ À NE PAS FAIRE :
- Ne pose JAMAIS plusieurs questions d'un coup
- Ne fais JAMAIS de listes à puces
- Ne mentionne JAMAIS "PMO", "cahier de charge", "thématique"
- Ne dis JAMAIS "j'ai besoin de collecter des informations"
- Ne sois pas robotique ou trop formel

═══════════════════════════════════════════════════════════════
                    🎭 EXEMPLES DE BONNES QUESTIONS
═══════════════════════════════════════════════════════════════

Au lieu de: "Quels sont vos moyens de paiement ?"
Dis: "Et côté paiement, tes clients ils préfèrent payer comment généralement ?"

Au lieu de: "Quelle est votre cible ?"
Dis: "C'est plutôt pour quel genre de personnes ton service ?"

Au lieu de: "Avez-vous besoin d'un système de fidélité ?"
Dis: "Tu as pensé à comment garder tes clients fidèles ? Genre leur donner envie de revenir ?"

Au lieu de: "Quelles fonctionnalités voulez-vous ?"
Dis: "Imagine ton client idéal qui utilise ton service... il fait quoi étape par étape ?"

═══════════════════════════════════════════════════════════════
                    ⏰ QUAND TERMINER LA CONVERSATION
═══════════════════════════════════════════════════════════════

Tu as ASSEZ d'informations quand tu connais :
✓ Le type de projet clairement
✓ La cible / les clients
✓ Les services ou produits principaux
✓ Comment ça fonctionne (le parcours client)
✓ Les moyens de paiement
✓ Au moins 2-3 autres aspects importants

Généralement après 8-15 échanges selon la complexité.

QUAND TU ES PRÊT, réponds avec :
[GENERATE]
Ta phrase de conclusion, exemple: "J'ai une bonne vision de ton projet ! Je te prépare ton cahier de charge, ça arrive dans quelques secondes..."

═══════════════════════════════════════════════════════════════
                    📤 FORMAT DE RÉPONSE
═══════════════════════════════════════════════════════════════

Réponds TOUJOURS en texte naturel conversationnel.
Quand tu es prêt à générer, commence ta réponse par [GENERATE]

EXEMPLES :

Réponse normale :
"Super intéressant le concept de pressing écolo ! Et du coup, tu comptes récupérer les vêtements comment ? C'est le client qui vient ou tu proposes un service de collecte ?"

Réponse quand prêt à générer :
"[GENERATE] Nickel, j'ai bien compris ton projet ! Tu veux un système complet pour gérer ton pressing avec la collecte à domicile, le suivi par SMS et le paiement Mobile Money. Je te prépare le cahier de charge..."

═══════════════════════════════════════════════════════════════
                    💬 DÉBUT DE CONVERSATION
═══════════════════════════════════════════════════════════════

Si c'est le PREMIER message et que le projet n'est pas clair :
"Salut ! Alors raconte-moi, c'est quoi ce projet que tu as en tête ?"

Si le projet est mentionné dès le début :
Rebondis directement dessus avec une question pour creuser.

Exemple - User dit "Je veux créer un pressing" :
"Un pressing, nice ! C'est un projet que tu démarres de zéro ou tu as déjà une activité que tu veux moderniser ?"`;

// ==================== HANDLE CHAT ====================
async function handleChat(res, message, history) {
    const historyText = history && history.length > 0 
        ? history.map(h => `${h.type === 'user' ? 'CLIENT' : 'NZELA'}: ${h.content}`).join('\n\n')
        : 'Aucun historique - C\'est le premier message du client';

    const fullPrompt = `${MASTER_PMO_PROMPT}

═══════════════════════════════════════════════════════════════
                    📜 HISTORIQUE DE LA CONVERSATION
═══════════════════════════════════════════════════════════════

${historyText}

═══════════════════════════════════════════════════════════════
                    ✉️ NOUVEAU MESSAGE DU CLIENT
═══════════════════════════════════════════════════════════════

"${message}"

═══════════════════════════════════════════════════════════════

Réponds naturellement comme un PMO bienveillant mènerait sa conversation de découverte.
Si tu as assez d'informations pour générer le cahier de charge, commence ta réponse par [GENERATE].`;

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
            temperature: 0.8, 
            max_tokens: 500 
        })
    });

    if (!response.ok) throw new Error('API Error');
    
    const data = await response.json();
    const aiResponse = data.choices[0].message.content.trim();
    
    // Vérifier si on doit générer
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
    const conversationText = history.map(h => `${h.type === 'user' ? 'CLIENT' : 'NZELA'}: ${h.content}`).join('\n\n');

    const generatePrompt = `Tu es un expert en rédaction de cahiers de charge.

Voici la conversation entre un consultant (Nzela) et son client :

═══════════════════════════════════════════════════════════════
${conversationText}
═══════════════════════════════════════════════════════════════

MISSION :
Génère un CAHIER DE CHARGE professionnel et complet basé sur cette conversation.

STRUCTURE DU DOCUMENT :

# CAHIER DE CHARGE
## [Nom du projet]

### 1. PRÉSENTATION DU PROJET
- Description générale
- Contexte et objectifs
- Problème résolu

### 2. CIBLE ET UTILISATEURS
- Utilisateurs principaux
- Profil type
- Besoins identifiés

### 3. FONCTIONNALITÉS PRINCIPALES
Liste des fonctionnalités essentielles détectées dans la conversation.
Pour chaque fonctionnalité :
- Nom de la fonctionnalité
- Description
- Priorité (Essentiel / Important / Bonus)

### 4. PARCOURS UTILISATEUR
Décris le parcours type d'un client/utilisateur étape par étape.

### 5. MOYENS DE PAIEMENT
Les options de paiement mentionnées ou recommandées.

### 6. NOTIFICATIONS ET COMMUNICATION
Comment le système communique avec les utilisateurs.

### 7. GESTION ET ADMINISTRATION
Fonctionnalités pour le gérant/admin.

### 8. CONTRAINTES ET EXIGENCES
- Budget (si mentionné)
- Délais (si mentionnés)
- Contraintes techniques
- Spécificités locales (Congo-Brazzaville)

### 9. RECOMMANDATIONS
Tes recommandations professionnelles basées sur le contexte.

═══════════════════════════════════════════════════════════════

RÈGLES :
- Base-toi UNIQUEMENT sur ce qui a été dit dans la conversation
- Si une information n'a pas été mentionnée, mets "À définir avec le client"
- Adapte au contexte Congo-Brazzaville (Mobile Money MTN/Airtel, FCFA)
- Sois professionnel mais accessible
- Utilise des termes que le client comprendra

Génère le cahier de charge maintenant :`;

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
