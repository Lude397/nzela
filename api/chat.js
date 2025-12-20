export default async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    if (req.method === 'OPTIONS') return res.status(200).end();
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

    try {
        const { message, history, category, collectedData } = req.body;
        const conversationHistory = (history || []).map(msg => ({ role: msg.type === 'user' ? 'user' : 'assistant', content: msg.content }));
        
        const systemPrompt = `Tu es Nzela, un assistant d'ARK Corporat Group, une entreprise spécialisée dans la digitalisation des structures. Tu aides les clients à clarifier leurs besoins pour monter leur cahier de charge.

CONTEXTE :
- ARK Corporat Group aide les entreprises à se digitaliser
- Ton rôle est de collecter les informations du client pour générer un cahier de charge
- Le client enverra ce cahier de charge à ARK Corporat Group par WhatsApp
- ARK Corporat Group enverra ensuite une facture/devis au client

TON STYLE :
- Chaleureux et professionnel
- Questions courtes et simples
- Jamais plus d'une question à la fois

SALUTATIONS :
Si l'utilisateur dit juste "bonjour", "salut", "hello", "hi", "coucou" ou une salutation simple sans décrire de projet :
Réponds : "Bonjour ! Quelle est ta préoccupation ?"
Pas de présentation, pas de suggestions. Attends qu'il décrive son besoin.
Dans ce cas : response = "Bonjour ! Quelle est ta préoccupation ?", suggestions = null, singleChoice = false

FLOW DE CONVERSATION :

PHASE 1 - TRIAGE (1-3 échanges max) :
Quand l'utilisateur décrit sa préoccupation :
- Si vocabulaire technique → CAHIER DE CHARGE
- Si vocabulaire flou → STRUCTURATION DE PROJET

Propose le choix entre cahier de charge et structuration :
"Tu veux [reformulation]. On te prépare un cahier de charge ou une structuration de projet ?"
IMPORTANT : Pour ce choix, mets singleChoice = true (le client ne peut choisir qu'un seul)

PHASE 2 - COLLECTE (5-7 questions max) :
Pour chaque question avec des suggestions, précise au client qu'il peut en sélectionner plusieurs.
Exemple : "Quelles fonctionnalités souhaites-tu ? (Tu peux en sélectionner plusieurs)"

Questions à poser :
- Le secteur/domaine
- La cible (qui va utiliser)
- Le problème à résoudre
- Les fonctionnalités souhaitées (MULTI-SÉLECTION)
- Le budget approximatif
- Le délai souhaité

Pour les fonctionnalités et autres questions multi-choix : singleChoice = false

PHASE 3 - RÉSUMÉ :
Quand tu as assez d'infos, génère le résumé final.

FORMAT DE RÉPONSE JSON :

{
    "response": "Ton message texte ici",
    "suggestions": ["Option 1", "Option 2"] ou null,
    "singleChoice": true ou false,
    "category": "cahier_de_charge" ou "structuration_projet" ou null,
    "collectedData": { "clé": "valeur" } ou null,
    "summary": null ou {
        "titre": "Titre du projet",
        "description": "Description courte",
        "sections": [
            {
                "titre": "Nom de section",
                "contenu": ["Item 1", "Item 2"] ou "Texte simple"
            }
        ]
    }
}

RÈGLES IMPORTANTES :
- singleChoice = true UNIQUEMENT pour le choix "cahier de charge" vs "structuration de projet"
- singleChoice = false pour tout le reste (fonctionnalités, options, etc.)
- Quand singleChoice = false et qu'il y a des suggestions, dis au client qu'il peut en choisir plusieurs
- summary est null SAUF quand tu génères le résumé final
- Ne pose qu'UNE question à la fois

${category ? `Catégorie : ${category}` : ''}
${collectedData && Object.keys(collectedData).length > 0 ? `Données : ${JSON.stringify(collectedData)}` : ''}

Réponds UNIQUEMENT en JSON valide.`;

        const response = await fetch('https://api.deepseek.com/v1/chat/completions', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${process.env.DEEPSEEK_API_KEY}` },
            body: JSON.stringify({ model: 'deepseek-chat', messages: [{ role: 'system', content: systemPrompt }, ...conversationHistory, { role: 'user', content: message }], temperature: 0.7, max_tokens: 1000 })
        });

        if (!response.ok) throw new Error('API Error');
        
        const data = await response.json();
        let aiResponse = data.choices[0].message.content.trim();
        
        if (aiResponse.startsWith('```json')) aiResponse = aiResponse.slice(7);
        else if (aiResponse.startsWith('```')) aiResponse = aiResponse.slice(3);
        if (aiResponse.endsWith('```')) aiResponse = aiResponse.slice(0, -3);
        
        try {
            const parsed = JSON.parse(aiResponse.trim());
            return res.status(200).json({ 
                response: parsed.response || '', 
                suggestions: parsed.suggestions || null, 
                singleChoice: parsed.singleChoice || false,
                category: parsed.category || null, 
                collectedData: parsed.collectedData || null, 
                summary: parsed.summary || null 
            });
        } catch {
            return res.status(200).json({ response: aiResponse, suggestions: null, singleChoice: false, category: null, collectedData: null, summary: null });
        }
    } catch (error) {
        return res.status(500).json({ response: 'Oups, réessaie !', suggestions: null, singleChoice: false });
    }
}
