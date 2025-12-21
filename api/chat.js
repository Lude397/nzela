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

function getRandomExemple() {
    return EXEMPLES[Math.floor(Math.random() * EXEMPLES.length)];
}

async function handleAnalyze(res, message, history) {
    const systemPrompt = `Tu es Nzela, un assistant d'ARK Corporat Group au Congo-Brazzaville.
Ta mission est de comprendre si le message de l'utilisateur contient une préoccupation claire ou non.

RÈGLES :
1. Si c'est une SALUTATION (bonjour, salut, hello, hi, coucou, bonsoir, etc.) :
   - Réponds poliment et demande la préoccupation
   - action = "ask_clarification"

2. Si le message est VAGUE ou INCOMPLET (ex: "je veux un truc", "j'ai besoin d'aide", "c'est pour un projet") :
   - Demande des éclaircissements avec un exemple concret
   - action = "ask_clarification"

3. Si le message contient une PRÉOCCUPATION CLAIRE (ex: "je veux digitaliser mon restaurant", "je veux créer une app pour gérer mon pressing") :
   - action = "proceed"
   - Extrais la préoccupation reformulée dans le champ "preoccupation"

EXEMPLE D'ÉCHANGE ALÉATOIRE À UTILISER : "${getRandomExemple()}"

FORMAT JSON OBLIGATOIRE :
{
    "action": "ask_clarification" ou "proceed",
    "response": "Ta réponse texte (seulement si ask_clarification)",
    "preoccupation": "La préoccupation claire extraite (seulement si proceed)"
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
    const categoryLabel = category === 'cahier_de_charge' ? 'cahier de charge' : 'structuration de projet';
    const categoryContext = category === 'cahier_de_charge' 
        ? 'les fonctionnalités techniques possibles pour une application ou un système digital'
        : 'les étapes et aspects à considérer pour lancer ce projet (étude de marché, juridique, financement, équipement, personnel, marketing, etc.)';

    const systemPrompt = `Tu es un expert en digitalisation et en structuration de projets pour ARK Corporat Group au Congo-Brazzaville.

MISSION :
Génère un ${categoryLabel} EXHAUSTIF et COMPLET pour la préoccupation suivante : "${preoccupation}"

Tu dois lister ${categoryContext}.

RÈGLES IMPORTANTES :
1. Génère entre 8 et 12 sections
2. Chaque section doit avoir entre 5 et 8 options
3. Chaque option doit avoir une définition claire et courte (1-2 phrases)
4. Sois EXHAUSTIF : imagine TOUTES les possibilités, même celles auxquelles le client n'aurait pas pensé
5. Adapte au contexte Congo-Brazzaville (Mobile Money, contexte africain, FCFA)
6. Les définitions doivent être compréhensibles par quelqu'un qui n'est pas technique

FORMAT JSON OBLIGATOIRE :

{
    "form": {
        "titre": "Titre du projet",
        "sections": [
            {
                "titre": "Nom de la section",
                "options": [
                    {
                        "nom": "Nom de l'option",
                        "definition": "Explication courte et claire de cette option"
                    }
                ]
            }
        ]
    }
}

${category === 'cahier_de_charge' ? `
POUR UN CAHIER DE CHARGE, pense à inclure des sections comme :
- Gestion des utilisateurs / clients
- Authentification et sécurité
- Fonctionnalités principales du métier
- Interface utilisateur
- Notifications
- Paiements (Mobile Money, Cash, etc.)
- Rapports et statistiques
- Administration
- Intégrations externes (WhatsApp, SMS, etc.)
- Aspects techniques (mobile, web, hors-ligne)
- Multi-langues
- Et d'autres sections spécifiques au domaine
` : `
POUR UNE STRUCTURATION DE PROJET, pense à inclure des sections comme :
- Étude de marché
- Analyse de la concurrence
- Définition de la cible
- Aspects juridiques et administratifs
- Financement et budget
- Choix du local / emplacement
- Équipement et matériel
- Ressources humaines
- Fournisseurs et partenaires
- Marketing et communication
- Stratégie de lancement
- Planification et calendrier
- Et d'autres sections spécifiques au domaine
`}

IMPORTANT : 
- Réponds UNIQUEMENT avec le JSON, rien d'autre
- Pas de texte avant ou après
- Pas de backticks
- Le JSON doit être valide
- Sois le plus exhaustif possible`;

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
            max_tokens: 2000 
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
