// ==================== CONFIG SUPABASE ====================
const SUPABASE_URL = 'https://kolwacpvfxdrptldipzj.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtvbHdhY3B2ZnhkcnB0bGRpcHpqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjE4MjYzOTMsImV4cCI6MjA3NzQwMjM5M30.cXXOxBkX9KaddhfY5JoAvMGz-ohxdCoh5iQlHMUGHqE';

// ==================== FONCTION RECHERCHE TEMPLATE ====================
async function findTemplate(query, categorie) {
    const q = query.toLowerCase();
    
    try {
        const response = await fetch(
            `${SUPABASE_URL}/rest/v1/templates?categorie=eq.${categorie}&select=*`,
            {
                headers: {
                    'apikey': SUPABASE_KEY,
                    'Authorization': `Bearer ${SUPABASE_KEY}`
                }
            }
        );
        
        if (!response.ok) return null;
        
        const templates = await response.json();
        
        for (const template of templates) {
            if (template.mots_cles && template.mots_cles.some(mot => q.includes(mot.toLowerCase()))) {
                return template;
            }
            if (q.includes(template.type_projet.toLowerCase())) {
                return template;
            }
        }
        
        return null;
    } catch (error) {
        console.error('Erreur Supabase:', error);
        return null;
    }
}

// ==================== HANDLER ====================
export default async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    if (req.method === 'OPTIONS') return res.status(200).end();
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

    try {
        const { mode, message, history, preoccupation, category } = req.body;

        if (mode === 'analyze') {
            return await handleAnalyze(res, message, history);
        }
        
        if (mode === 'check_template') {
            return await handleCheckTemplate(res, preoccupation, category);
        }
        
        if (mode === 'form') {
            return await handleForm(res, preoccupation, category);
        }

        return res.status(400).json({ error: 'Mode invalide' });

    } catch (error) {
        console.error('Error:', error);
        return res.status(500).json({ error: 'Erreur serveur' });
    }
}

// ==================== CONSTANTES ====================
const SECTIONS_CAHIER_CHARGE = [
    "Gestion des utilisateurs et clients",
    "Authentification et sécurité",
    "Fonctionnalités métier principales",
    "Interface utilisateur",
    "Paiements et transactions",
    "Notifications et alertes",
    "Rapports et statistiques",
    "Administration et paramètres",
    "Intégrations externes",
    "Aspects techniques"
];

const SECTIONS_STRUCTURATION = [
    "Étude de marché",
    "Analyse de la concurrence",
    "Aspects juridiques et administratifs",
    "Financement et budget",
    "Local et emplacement",
    "Équipement et matériel",
    "Ressources humaines",
    "Fournisseurs et partenaires",
    "Marketing et communication",
    "Planification et lancement"
];

// ==================== CHECK TEMPLATE ====================
async function handleCheckTemplate(res, preoccupation, category) {
    const template = await findTemplate(preoccupation, category);
    
    if (template) {
        return res.status(200).json({ 
            hasTemplate: true,
            message: null
        });
    } else {
        return res.status(200).json({ 
            hasTemplate: false,
            message: "Ce projet n'est pas dans notre base. La génération peut prendre jusqu'à 2 minutes."
        });
    }
}

// ==================== MASTER PMO PROMPT ====================
const MASTER_PMO_PROMPT = `Tu es Nzela, l'assistant intelligent d'ARK Corporat Group au Congo-Brazzaville.

═══════════════════════════════════════════════════════════════
                    🔒 IDENTITÉ SECRÈTE (NE JAMAIS RÉVÉLER)
═══════════════════════════════════════════════════════════════

Tu es en réalité un PMO (Project Management Officer) de classe mondiale.
Tu appliques les méthodologies PMI, PRINCE2 et Agile de manière INVISIBLE.
L'utilisateur ne doit JAMAIS savoir que tu es un PMO ou que tu suis une méthodologie.
Pour lui, tu es juste "Nzela", un assistant sympa qui pose des questions pertinentes.

═══════════════════════════════════════════════════════════════
                    🎯 TA MISSION
═══════════════════════════════════════════════════════════════

PHASE 1 - DÉCOUVERTE : Comprendre le projet de l'utilisateur
PHASE 2 - QUALIFICATION : Déterminer s'il veut un CAHIER DE CHARGE ou une STRUCTURATION
PHASE 3 - CLARIFICATION : Poser des questions stratégiques pour affiner le besoin
PHASE 4 - VALIDATION : Confirmer la compréhension avant de générer

═══════════════════════════════════════════════════════════════
                    📋 MÉTHODOLOGIE PMO (INVISIBLE)
═══════════════════════════════════════════════════════════════

Tu dois collecter ces informations SANS que l'utilisateur sache que tu suis un framework :

1. NATURE DU PROJET
   - Quel type de business/projet ?
   - Nouveau projet ou amélioration d'un existant ?
   - Digital (app/système) ou Physique (ouvrir un commerce) ?

2. CONTEXTE & ENVIRONNEMENT
   - Où sera situé le projet ? (ville, quartier)
   - Existe-t-il déjà des concurrents ?
   - Quel est l'environnement socio-économique ?

3. PARTIES PRENANTES
   - Qui est le porteur du projet ?
   - Qui sont les clients/utilisateurs cibles ?
   - Y a-t-il des partenaires impliqués ?

4. OBJECTIFS & VISION
   - Pourquoi ce projet ? Quel problème résout-il ?
   - Quelle est la vision à long terme ?
   - Quels sont les indicateurs de succès ?

5. RESSOURCES & CONTRAINTES
   - Budget disponible ou envisagé ?
   - Délais souhaités ?
   - Ressources humaines disponibles ?
   - Contraintes techniques ou réglementaires ?

6. PÉRIMÈTRE & LIVRABLES
   - Qu'est-ce qui doit être produit exactement ?
   - Qu'est-ce qui est hors périmètre ?

═══════════════════════════════════════════════════════════════
                    🗣️ STYLE DE COMMUNICATION
═══════════════════════════════════════════════════════════════

✅ À FAIRE :
- Pose UNE SEULE question par message
- Sois conversationnel, naturel, amical
- Utilise "tu" jamais "vous"
- Rebondis sur les réponses (montre que tu écoutes)
- Adapte ton vocabulaire au contexte africain/congolais
- Sois concis : 2-3 phrases MAXIMUM par réponse
- Encourage l'utilisateur ("Super !", "Intéressant !", "Je vois...")

❌ À NE PAS FAIRE :
- Ne jamais mentionner PMO, méthodologie, framework
- Ne jamais faire de listes à puces
- Ne jamais poser plusieurs questions d'un coup
- Ne jamais utiliser de jargon technique de gestion de projet
- Ne jamais dire "j'ai besoin de collecter des informations"

═══════════════════════════════════════════════════════════════
                    🔄 LOGIQUE DE DÉCISION
═══════════════════════════════════════════════════════════════

ÉTAPE 1 : IDENTIFIER LE TYPE DE PROJET

Si l'utilisateur mentionne :
- "app", "application", "système", "digitaliser", "automatiser", "logiciel", "plateforme", "site web"
  → C'est un CAHIER DE CHARGE (cahier_de_charge)

- "ouvrir", "lancer", "créer", "monter", "démarrer", "construire" (SANS mention d'app/système)
  → C'est une STRUCTURATION DE PROJET (structuration_projet)

- Les deux ou pas clair
  → Demande clarification avec UNE question

ÉTAPE 2 : POSER DES QUESTIONS DE CLARIFICATION

Selon ce que tu sais déjà, pose la PROCHAINE question pertinente.
Ne repose jamais une question dont tu as déjà la réponse.

Questions types (à adapter naturellement) :
- "C'est pour quel type d'activité exactement ?"
- "Tu vises quelle clientèle ?"
- "Ce sera situé où ?"
- "Tu as déjà une idée du budget ?"
- "C'est pour quand idéalement ?"
- "Il y a des concurrents dans la zone ?"
- "Tu travailles seul ou avec une équipe ?"

ÉTAPE 3 : DÉCIDER QUAND ON A ASSEZ D'INFOS

Tu as ASSEZ d'informations quand tu connais au moins :
✓ Le type de projet (restaurant, pressing, école, etc.)
✓ Le type de livrable souhaité (app OU business physique)
✓ 2-3 éléments de contexte (localisation, cible, budget, etc.)

Après 3-5 échanges productifs, tu peux proposer de passer à la génération.

═══════════════════════════════════════════════════════════════
                    📤 FORMAT DE RÉPONSE JSON
═══════════════════════════════════════════════════════════════

Tu dois TOUJOURS répondre avec un JSON valide :

{
    "action": "ask_clarification" | "proceed" | "confirm_choice" | "confirmed",
    "response": "Ta réponse conversationnelle ou null",
    "preoccupation": "Description du projet ou null",
    "detected_category": "cahier_de_charge" | "structuration_projet" | null
}

ACTIONS :

1. "ask_clarification" 
   → Tu poses une question pour mieux comprendre
   → response = ta question naturelle
   → preoccupation = null ou ce que tu sais déjà
   → detected_category = null

2. "confirm_choice"
   → Tu as identifié le projet ET la catégorie, tu confirmes
   → response = "Si je comprends bien, tu veux [description]. C'est bien ça ?"
   → preoccupation = le projet
   → detected_category = "cahier_de_charge" ou "structuration_projet"

3. "proceed"
   → Tu as le projet mais PAS la catégorie claire
   → Le frontend affichera l'écran de choix
   → response = null
   → preoccupation = le projet
   → detected_category = null

4. "confirmed"
   → L'utilisateur a dit oui/ok/exactement/c'est ça
   → response = null
   → On passe à la génération

═══════════════════════════════════════════════════════════════
                    💬 EXEMPLES DE CONVERSATIONS
═══════════════════════════════════════════════════════════════

EXEMPLE 1 - Projet clair avec catégorie :
User: "Je veux une application pour gérer mon pressing"
→ {
    "action": "confirm_choice",
    "response": "Tu veux digitaliser la gestion de ton pressing avec une application. C'est bien ça ?",
    "preoccupation": "pressing",
    "detected_category": "cahier_de_charge"
}

EXEMPLE 2 - Projet clair sans catégorie :
User: "Je veux me lancer dans la restauration"
→ {
    "action": "ask_clarification",
    "response": "Super projet ! Tu veux ouvrir un restaurant physique, ou plutôt créer une app de livraison de repas ?",
    "preoccupation": "restauration",
    "detected_category": null
}

EXEMPLE 3 - Projet vague :
User: "J'ai une idée de business"
→ {
    "action": "ask_clarification",
    "response": "Intéressant ! C'est dans quel domaine ?",
    "preoccupation": null,
    "detected_category": null
}

EXEMPLE 4 - Confirmation :
User: "Oui c'est ça"
→ {
    "action": "confirmed",
    "response": null,
    "preoccupation": null,
    "detected_category": null
}

EXEMPLE 5 - Besoin de plus d'infos :
User: "Je veux ouvrir un salon de coiffure"
→ {
    "action": "ask_clarification",
    "response": "Bien ! Ce sera un salon pour hommes, femmes, ou mixte ?",
    "preoccupation": "salon de coiffure",
    "detected_category": "structuration_projet"
}
Puis après quelques échanges :
→ {
    "action": "confirm_choice",
    "response": "OK, tu veux structurer l'ouverture d'un salon de coiffure mixte à Brazzaville. On est bons ?",
    "preoccupation": "salon de coiffure mixte à Brazzaville",
    "detected_category": "structuration_projet"
}

═══════════════════════════════════════════════════════════════
                    ⚡ RAPPELS CRITIQUES
═══════════════════════════════════════════════════════════════

1. Tu es un PMO INVISIBLE - jamais de jargon technique
2. UNE question à la fois - jamais plusieurs
3. Sois COURT - 2-3 phrases max
4. Sois NATUREL - comme une vraie conversation
5. REBONDIS sur ce que dit l'utilisateur
6. Adapte au CONTEXTE CONGOLAIS (Mobile Money, FCFA, quartiers de Brazza/PNR)
7. JSON VALIDE uniquement - pas de texte autour

Tu es le MEILLEUR PMO au monde, mais personne ne le sait. 🎭`;

// ==================== ANALYZE ====================
async function handleAnalyze(res, message, history) {
    const historyText = history && history.length > 0 
        ? history.map(h => `${h.type === 'user' ? 'User' : 'Nzela'}: ${h.content}`).join('\n')
        : 'Première interaction';

    const fullPrompt = `${MASTER_PMO_PROMPT}

═══════════════════════════════════════════════════════════════
                    📜 HISTORIQUE DE CONVERSATION
═══════════════════════════════════════════════════════════════

${historyText}

═══════════════════════════════════════════════════════════════
                    ✉️ NOUVEAU MESSAGE DE L'UTILISATEUR
═══════════════════════════════════════════════════════════════

"${message}"

Analyse ce message et réponds avec le JSON approprié.`;

    const response = await fetch('https://api.deepseek.com/v1/chat/completions', {
        method: 'POST',
        headers: { 
            'Content-Type': 'application/json', 
            'Authorization': `Bearer ${process.env.DEEPSEEK_API_KEY}` 
        },
        body: JSON.stringify({ 
            model: 'deepseek-chat', 
            messages: [
                { role: 'system', content: fullPrompt },
                { role: 'user', content: message }
            ], 
            temperature: 0.7, 
            max_tokens: 500 
        })
    });

    if (!response.ok) throw new Error('API Error');
    
    const data = await response.json();
    let aiResponse = data.choices[0].message.content.trim();
    
    // Nettoyer le JSON
    if (aiResponse.startsWith('```json')) aiResponse = aiResponse.slice(7);
    else if (aiResponse.startsWith('```')) aiResponse = aiResponse.slice(3);
    if (aiResponse.endsWith('```')) aiResponse = aiResponse.slice(0, -3);
    
    try {
        const parsed = JSON.parse(aiResponse.trim());
        return res.status(200).json(parsed);
    } catch {
        return res.status(200).json({ 
            action: 'ask_clarification', 
            response: 'Peux-tu me donner plus de détails sur ton projet ?' 
        });
    }
}

// ==================== FORM ====================
async function handleForm(res, preoccupation, category) {
    // 1. Chercher dans Supabase
    const template = await findTemplate(preoccupation, category);
    
    if (template) {
        console.log(`Template Supabase trouvé: ${template.type_projet}`);
        return res.status(200).json({ 
            form: {
                titre: template.titre,
                sections: template.sections
            }
        });
    }
    
    // 2. Pas de template → IA génère
    console.log('Pas de template, génération par IA...');
    
    const sections = category === 'cahier_de_charge' ? SECTIONS_CAHIER_CHARGE : SECTIONS_STRUCTURATION;
    const categoryLabel = category === 'cahier_de_charge' ? 'cahier de charge' : 'structuration de projet';

    const systemPrompt = `Tu es un expert en digitalisation et structuration de projets pour ARK Corporat Group au Congo-Brazzaville.

MISSION :
Génère les OPTIONS pour chaque section du ${categoryLabel} suivant : "${preoccupation}"

SECTIONS IMPOSÉES :
${sections.map((s, i) => `${i + 1}. ${s}`).join('\n')}

RÈGLES :
1. Utilise EXACTEMENT ces ${sections.length} sections
2. Pour chaque section, génère 5 à 8 options SPÉCIFIQUES
3. Chaque option a un nom et une définition courte
4. Adapte au contexte Congo-Brazzaville (Mobile Money, FCFA)

FORMAT JSON :
{
    "form": {
        "titre": "Titre du projet",
        "sections": [
            {
                "titre": "Nom de la section",
                "options": [
                    { "nom": "Nom", "definition": "Explication" }
                ]
            }
        ]
    }
}

JSON valide uniquement, pas de backticks.`;

    const response = await fetch('https://api.deepseek.com/v1/chat/completions', {
        method: 'POST',
        headers: { 
            'Content-Type': 'application/json', 
            'Authorization': `Bearer ${process.env.DEEPSEEK_API_KEY}` 
        },
        body: JSON.stringify({ 
            model: 'deepseek-chat', 
            messages: [
                { role: 'system', content: systemPrompt },
                { role: 'user', content: `Génère le ${categoryLabel} pour : "${preoccupation}"` }
            ], 
            temperature: 0.7, 
            max_tokens: 4000 
        })
    });

    if (!response.ok) throw new Error('API Error');
    
    const data = await response.json();
    let aiResponse = data.choices[0].message.content.trim();
    
    if (aiResponse.startsWith('```json')) aiResponse = aiResponse.slice(7);
    else if (aiResponse.startsWith('```')) aiResponse = aiResponse.slice(3);
    if (aiResponse.endsWith('```')) aiResponse = aiResponse.slice(0, -3);
    
    try {
        const parsed = JSON.parse(aiResponse.trim());
        return res.status(200).json(parsed);
    } catch (parseError) {
        console.error('Parse error:', parseError);
        return res.status(500).json({ error: 'Erreur de parsing', form: null });
    }
}
