export default async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    if (req.method === 'OPTIONS') return res.status(200).end();
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

    try {
        const { mode, message, history, preoccupation, category } = req.body;

        // MODE ANALYSE : Détecter si le message est une préoccupation claire
        if (mode === 'analyze') {
            return await handleAnalyze(res, message, history);
        }
        
        // MODE FORMULAIRE : Générer le formulaire exhaustif
        if (mode === 'form') {
            return await handleForm(res, preoccupation, category);
        }

        return res.status(400).json({ error: 'Mode invalide' });

    } catch (error) {
        console.error('Error:', error);
        return res.status(500).json({ error: 'Erreur serveur' });
    }
}

// Exemples aléatoires pour les demandes de clarification
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
    "Je veux gérer mon supermarché avec une app",
    "Je veux créer un système pour ma quincaillerie",
    "Je veux automatiser ma librairie",
    "Je veux digitaliser ma boulangerie",
    "Je veux créer une app pour mon bar",
    "Je veux créer une clinique",
    "Je veux gérer ma poissonnerie",
    "Je veux gérer mon école avec un système",
    "Je veux automatiser ma salle de sport",
    "Je veux automatiser mon auberge",
    "Je veux ouvrir une librairie",
    "Je veux gérer mon supermarché"
];

// Templates de sections fixes
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

async function handleAnalyze(res, message, history) {
    const systemPrompt = `Tu es Nzela, un assistant d'ARK Corporat Group au Congo-Brazzaville.
Ta mission est de comprendre le message de l'utilisateur.

RÈGLES :
1. Si c'est une SALUTATION (bonjour, salut, hello, hi, coucou, bonsoir, etc.) :
   - Réponds poliment et demande la préoccupation
   - action = "ask_clarification"

2. Si le message est VAGUE ou INCOMPLET (ex: "je veux un truc", "j'ai besoin d'aide", "c'est pour un projet") :
   - Demande des éclaircissements avec un exemple concret
   - action = "ask_clarification"

3. Si le message contient une PRÉOCCUPATION CLAIRE avec TYPE DE PROJET (restaurant, pressing, boutique, salon, école, etc.) :
   
   a) Si l'utilisateur PRÉCISE "cahier de charge", "cahier des charges", "application", "app", "système", "digitaliser" :
      - action = "confirm_choice"
      - detected_category = "cahier_de_charge"
      - response = Une phrase pour confirmer, ex: "Tu veux un cahier de charge pour ton pressing, c'est bien ça ?"
   
   b) Si l'utilisateur PRÉCISE "structuration", "structurer", "lancer", "ouvrir", "créer", "monter" (sans parler d'app) :
      - action = "confirm_choice"
      - detected_category = "structuration_projet"
      - response = Une phrase pour confirmer, ex: "Tu veux structurer ton projet de restaurant, c'est bien ça ?"
   
   c) Si l'utilisateur ne précise PAS ce qu'il veut :
      - action = "proceed"
      - Extrais la préoccupation reformulée

4. Si l'utilisateur répond "oui", "ouais", "c'est ça", "exactement", "correct", "affirmatif", "yes", "ok" à une question de confirmation :
   - action = "confirmed"

EXEMPLE : "${getRandomExemple()}"

FORMAT JSON OBLIGATOIRE :
{
    "action": "ask_clarification" | "proceed" | "confirm_choice" | "confirmed",
    "response": "Ta réponse texte (si ask_clarification ou confirm_choice)",
    "preoccupation": "La préoccupation extraite (si proceed ou confirm_choice)",
    "detected_category": "cahier_de_charge" | "structuration_projet" (seulement si confirm_choice)
}

STYLE :
- Professionnel mais chaleureux
- Pas d'emojis
- Phrases courtes et simples
- En français

Historique de la conversation :
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
    
    // Nettoyer la réponse
    if (aiResponse.startsWith('```json')) aiResponse = aiResponse.slice(7);
    else if (aiResponse.startsWith('```')) aiResponse = aiResponse.slice(3);
    if (aiResponse.endsWith('```')) aiResponse = aiResponse.slice(0, -3);
    
    try {
        const parsed = JSON.parse(aiResponse.trim());
        return res.status(200).json(parsed);
    } catch {
        // Fallback si le parsing échoue
        return res.status(200).json({ 
            action: 'ask_clarification', 
            response: 'Peux-tu me donner plus de détails sur ton projet ?' 
        });
    }
}

async function handleForm(res, preoccupation, category) {
    const sections = category === 'cahier_de_charge' ? SECTIONS_CAHIER_CHARGE : SECTIONS_STRUCTURATION;
    const categoryLabel = category === 'cahier_de_charge' ? 'cahier de charge' : 'structuration de projet';

    const systemPrompt = `Tu es un expert en digitalisation et structuration de projets pour ARK Corporat Group au Congo-Brazzaville.

MISSION :
Génère les OPTIONS pour chaque section du ${categoryLabel} suivant : "${preoccupation}"

SECTIONS IMPOSÉES (tu dois TOUTES les utiliser) :
${sections.map((s, i) => `${i + 1}. ${s}`).join('\n')}

RÈGLES :
1. Utilise EXACTEMENT ces ${sections.length} sections, dans cet ordre
2. Pour chaque section, génère 5 à 8 options SPÉCIFIQUES au projet "${preoccupation}"
3. Chaque option a un nom et une définition courte (1-2 phrases)
4. Adapte au contexte Congo-Brazzaville (Mobile Money, FCFA, réalités locales)
5. Sois EXHAUSTIF et CRÉATIF pour chaque option

FORMAT JSON OBLIGATOIRE :
{
    "form": {
        "titre": "Titre du projet",
        "sections": [
            {
                "titre": "Nom de la section (utilise ceux imposés)",
                "options": [
                    {
                        "nom": "Nom de l'option",
                        "definition": "Explication courte"
                    }
                ]
            }
        ]
    }
}

IMPORTANT :
- JSON valide uniquement
- Pas de backticks
- Pas de texte avant/après`;

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
                { role: 'user', content: `Génère le ${categoryLabel} complet pour : "${preoccupation}"` }
            ], 
            temperature: 0.7, 
            max_tokens: 4000 
        })
    });

    if (!response.ok) throw new Error('API Error');
    
    const data = await response.json();
    let aiResponse = data.choices[0].message.content.trim();
    
    // Nettoyer la réponse
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
