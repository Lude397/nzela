export default async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    if (req.method === 'OPTIONS') return res.status(200).end();
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

    try {
        const { preoccupation, category } = req.body;
        
        const categoryLabel = category === 'cahier_de_charge' ? 'cahier de charge' : 'structuration de projet';
        const categoryContext = category === 'cahier_de_charge' 
            ? 'les fonctionnalités techniques possibles pour une application ou un système digital'
            : 'les étapes et aspects à considérer pour lancer ce projet (étude de marché, juridique, financement, équipement, personnel, marketing, etc.)';

        const systemPrompt = `Tu es un expert en digitalisation et en structuration de projets pour ARK Corporat Group au Congo-Brazzaville.

MISSION :
Génère un ${categoryLabel} EXHAUSTIF et COMPLET pour la préoccupation suivante : "${preoccupation}"

Tu dois lister ${categoryContext}.

RÈGLES IMPORTANTES :
1. Génère entre 10 et 20 sections
2. Chaque section doit avoir entre 5 et 15 options
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
- Paiements
- Rapports et statistiques
- Administration
- Intégrations externes
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
- Pas de \`\`\`json
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
                max_tokens: 4000 
            })
        });

        if (!response.ok) {
            throw new Error('API Error');
        }
        
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
            console.error('Response:', aiResponse);
            return res.status(500).json({ error: 'Erreur de parsing', form: null });
        }
    } catch (error) {
        console.error('Error:', error);
        return res.status(500).json({ error: 'Erreur serveur', form: null });
    }
}
