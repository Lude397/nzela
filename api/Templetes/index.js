import { beaute } from './beaute.js';

// Combiner tous les templates
export const TEMPLATES = {
    ...beaute
};

// Fonction pour trouver un template par mots-clés
export function findTemplate(query) {
    const q = query.toLowerCase();
    
    // Mots-clés pour chaque type de projet
    const keywords = {
        "pressing": ["pressing", "blanchisserie", "laverie", "nettoyage vêtements", "laver linge", "repassage"]
    };
    
    // Chercher le template correspondant
    for (const [projet, mots] of Object.entries(keywords)) {
        if (mots.some(mot => q.includes(mot))) {
            return { projet, template: TEMPLATES[projet] };
        }
    }
    
    // Chercher directement dans les clés de TEMPLATES
    for (const projet of Object.keys(TEMPLATES)) {
        if (q.includes(projet)) {
            return { projet, template: TEMPLATES[projet] };
        }
    }
    
    return null;
}
