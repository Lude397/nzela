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

User: "Je veux lancer un restaurant"
✅ "La restauration, marché dynamique à Brazza. Quel concept : fast-food, maquis, ou restaurant classique ?"

User: "Les particuliers surtout"
✅ "Noté. Tu prévois un service de collecte à domicile ou le client vient déposer sur place ?"

User: "Collecte à domicile"
✅ "Bonne idée, ça différencie. Quelle zone géographique tu veux couvrir au démarrage ?"

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
Bien, j'ai les éléments clés. Je te prépare le cahier de charge.

═══════════════════════════════════════════════════════════════
                    🚀 PREMIÈRE RÉPONSE
═══════════════════════════════════════════════════════════════

Format : "[Domaine], c'est [constat court]. [Question directe] ?"

Exemples :
- "Transport urbain à Brazzaville, c'est un secteur porteur. Quel type de service envisages-tu : lignes régulières ou transport à la demande ?"
- "Le pressing, c'est un service très demandé. Tu cibles les particuliers, les entreprises, ou les deux ?"
- "Un cyber café, besoin réel dans beaucoup de quartiers. Tu vises quel public : étudiants, professionnels, ou tout le monde ?"`;

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

// ==================== HANDLE GENERATE ====================
async function handleGenerate(res, history) {
    const conversationText = history.map(h => `${h.type === 'user' ? 'CLIENT' : 'CONSULTANT'}: ${h.content}`).join('\n\n');

    const generatePrompt = `Tu es un expert en rédaction de cahiers de charge.

CONVERSATION :
═══════════════════════════════════════════════════════════════
${conversationText}
═══════════════════════════════════════════════════════════════

Génère un CAHIER DE CHARGE professionnel basé sur cette conversation.

STRUCTURE :

# CAHIER DE CHARGE
## [Nom du projet]

---

### 1. PRÉSENTATION DU PROJET
**Description :** [2-3 phrases]
**Objectif :** [1-2 phrases]

---

### 2. CIBLE & MARCHÉ
**Clientèle visée :** [description]
**Zone géographique :** [localisation]

---

### 3. SERVICES PROPOSÉS
[Liste des services identifiés]

---

### 4. FONCTIONNEMENT
**Parcours client :** [étapes]
**Moyens de paiement :** [options]

---

### 5. ORGANISATION
**Équipe :** [structure prévue]
**Outils nécessaires :** [liste]

---

### 6. BUDGET & PLANNING
**Budget estimé :** [montant ou "À définir"]
**Délai de lancement :** [date ou "À définir"]

---

### 7. RECOMMANDATIONS
[2-3 conseils professionnels]

---

*Document généré par Nzela - ARK Corporat Group*
*${new Date().toLocaleDateString('fr-FR')}*

RÈGLES :
- Base-toi UNIQUEMENT sur la conversation
- Si info manquante → "À définir"
- Style clair et professionnel
- Adapté au contexte Congo-Brazzaville (Mobile Money, FCFA)`;

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
