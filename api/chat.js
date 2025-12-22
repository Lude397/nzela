// ==================== CONFIG SUPABASE ====================
const SUPABASE_URL = 'https://kolwacpvfxdrptldipzj.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtvbHdhY3B2ZnhkcnB0bGRpcHpqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjE4MjYzOTMsImV4cCI6MjA3NzQwMjM5M30.cXXOxBkX9KaddhfY5JoAvMGz-ohxdCoh5iQlHMUGHqE';

// ==================== FONCTION RECHERCHE TEMPLATE ====================
async function findTemplate(query, categorie) {
    const q = query.toLowerCase();
    
    try {
        // Recherche par mots-clés ou type_projet
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
        
        // Chercher le template correspondant
        for (const template of templates) {
            // Vérifier dans mots_cles
            if (template.mots_cles && template.mots_cles.some(mot => q.includes(mot.toLowerCase()))) {
                return template;
            }
            // Vérifier dans type_projet
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
const EXEMPLES = [
    "Je veux digitaliser mon pressing",
    "Je veux créer une app pour ma boutique",
    "Je veux lancer un salon de coiffure",
    "Je veux gérer mon école avec un système",
    "Je veux ouvrir une boulangerie",
    "Je veux automatiser ma pharmacie",
    "Je veux créer un hôtel",
    "Je veux lancer un garage auto",
    "Je veux digitaliser ma boutique de vêtements",
    "Je veux gérer mon supermarché avec une app"
];

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

function getRandomExemple() {
    return EXEMPLES[Math.floor(Math.random() * EXEMPLES.length)];
}

// ==================== ANALYZE ====================
async function handleAnalyze(res, message, history) {
    const systemPrompt = `Tu es Nzela, un assistant d'ARK Corporat Group au Congo-Brazzaville.
Ta mission est de comprendre le message de l'utilisateur.

RÈGLES :
1. Si c'est une SALUTATION (bonjour, salut, hello, hi, coucou, bonsoir, etc.) :
   - Réponds poliment et demande la préoccupation
   - action = "ask_clarification"

2. Si le message est VAGUE ou INCOMPLET :
   - Demande des éclaircissements avec un exemple concret
   - action = "ask_clarification"

3. Si le message contient une PRÉOCCUPATION CLAIRE avec TYPE DE PROJET :
   
   a) Si l'utilisateur PRÉCISE "cahier de charge", "application", "app", "système", "digitaliser" :
      - action = "confirm_choice"
      - detected_category = "cahier_de_charge"
      - response = Une phrase pour confirmer
   
   b) Si l'utilisateur PRÉCISE "structuration", "structurer", "lancer", "ouvrir", "créer", "monter" (sans parler d'app) :
      - action = "confirm_choice"
      - detected_category = "structuration_projet"
      - response = Une phrase pour confirmer
   
   c) Si l'utilisateur ne précise PAS ce qu'il veut :
      - action = "proceed"
      - Extrais la préoccupation reformulée

4. Si l'utilisateur répond "oui", "ouais", "c'est ça", "exactement", "correct", "ok" :
   - action = "confirmed"

EXEMPLE : "${getRandomExemple()}"

FORMAT JSON OBLIGATOIRE :
{
    "action": "ask_clarification" | "proceed" | "confirm_choice" | "confirmed",
    "response": "Ta réponse texte",
    "preoccupation": "La préoccupation extraite",
    "detected_category": "cahier_de_charge" | "structuration_projet"
}

Historique :
${history ? history.map(h => `${h.type === 'user' ? 'Utilisateur' : 'Nzela'}: ${h.content}`).join('\n') : 'Aucun'}

Réponds UNIQUEMENT en JSON valide, sans backticks.`;

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
                { role: 'user', content: message }
            ], 
            temperature: 0.7, 
            max_tokens: 500 
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
