export const beaute = {
    "pressing": {
        cahier_de_charge: {
            titre: "Application de gestion - Pressing",
            sections: [
                {
                    titre: "Gestion des utilisateurs et clients",
                    options: [
                        { nom: "Création de compte client", definition: "Permettre aux clients de créer un compte avec leurs informations personnelles" },
                        { nom: "Historique des commandes", definition: "Consulter toutes les commandes passées par le client" },
                        { nom: "Programme de fidélité", definition: "Système de points ou réductions pour les clients réguliers" },
                        { nom: "Carnet d'adresses", definition: "Enregistrer plusieurs adresses de livraison/récupération" },
                        { nom: "Préférences client", definition: "Mémoriser les préférences de lavage et repassage de chaque client" },
                        { nom: "Notifications personnalisées", definition: "Alertes sur les promotions et statut des commandes" }
                    ]
                },
                {
                    titre: "Authentification et sécurité",
                    options: [
                        { nom: "Connexion par téléphone", definition: "Se connecter avec son numéro de téléphone et code SMS" },
                        { nom: "Connexion par email", definition: "Se connecter avec email et mot de passe" },
                        { nom: "Code PIN", definition: "Accès rapide avec un code à 4 chiffres" },
                        { nom: "Rôles utilisateurs", definition: "Définir les droits d'accès (admin, employé, client)" },
                        { nom: "Session sécurisée", definition: "Déconnexion automatique après inactivité" }
                    ]
                },
                {
                    titre: "Fonctionnalités métier principales",
                    options: [
                        { nom: "Dépôt de vêtements", definition: "Enregistrer les vêtements déposés avec description et photos" },
                        { nom: "Étiquetage des articles", definition: "Générer des codes-barres ou QR codes pour chaque article" },
                        { nom: "Suivi en temps réel", definition: "Voir l'état du traitement (réception, lavage, repassage, prêt)" },
                        { nom: "Types de services", definition: "Lavage simple, pressing, repassage seul, nettoyage à sec" },
                        { nom: "Traitement express", definition: "Option de service rapide avec supplément" },
                        { nom: "Gestion des taches", definition: "Signaler et traiter les taches spéciales" },
                        { nom: "Livraison à domicile", definition: "Service de collecte et livraison des vêtements" },
                        { nom: "Planification de collecte", definition: "Réserver un créneau pour la collecte des vêtements" }
                    ]
                },
                {
                    titre: "Interface utilisateur",
                    options: [
                        { nom: "Application mobile", definition: "Application pour smartphone Android et iOS" },
                        { nom: "Interface web", definition: "Accès depuis un navigateur sur ordinateur" },
                        { nom: "Mode sombre", definition: "Thème sombre pour réduire la fatigue visuelle" },
                        { nom: "Multi-langues", definition: "Français, Lingala, et autres langues locales" },
                        { nom: "Interface tactile caisse", definition: "Écran tactile optimisé pour la réception des vêtements" }
                    ]
                },
                {
                    titre: "Paiements et transactions",
                    options: [
                        { nom: "Paiement Mobile Money", definition: "Payer via MTN Mobile Money, Airtel Money" },
                        { nom: "Paiement en espèces", definition: "Enregistrer les paiements cash à la caisse" },
                        { nom: "Paiement à la livraison", definition: "Payer lors de la récupération des vêtements" },
                        { nom: "Factures automatiques", definition: "Génération automatique des factures et reçus" },
                        { nom: "Acompte à la commande", definition: "Paiement partiel lors du dépôt" },
                        { nom: "Gestion des impayés", definition: "Suivi et relance des paiements en attente" }
                    ]
                },
                {
                    titre: "Notifications et alertes",
                    options: [
                        { nom: "SMS de confirmation", definition: "SMS envoyé à chaque étape du traitement" },
                        { nom: "Notification WhatsApp", definition: "Messages WhatsApp pour le suivi des commandes" },
                        { nom: "Rappel de récupération", definition: "Alerte quand les vêtements sont prêts depuis longtemps" },
                        { nom: "Alertes promotionnelles", definition: "Informer les clients des offres spéciales" },
                        { nom: "Notification push", definition: "Alertes directes sur l'application mobile" }
                    ]
                },
                {
                    titre: "Rapports et statistiques",
                    options: [
                        { nom: "Chiffre d'affaires", definition: "Voir les revenus par jour, semaine, mois" },
                        { nom: "Articles traités", definition: "Nombre de vêtements traités par période" },
                        { nom: "Clients actifs", definition: "Statistiques sur la clientèle et fidélisation" },
                        { nom: "Performance employés", definition: "Suivi de la productivité de chaque employé" },
                        { nom: "Rapport de caisse", definition: "Bilan des entrées et sorties d'argent" },
                        { nom: "Export des données", definition: "Télécharger les rapports en PDF ou Excel" }
                    ]
                },
                {
                    titre: "Administration et paramètres",
                    options: [
                        { nom: "Gestion des tarifs", definition: "Définir et modifier les prix des services" },
                        { nom: "Gestion des employés", definition: "Ajouter, modifier, supprimer des employés" },
                        { nom: "Horaires d'ouverture", definition: "Configurer les heures de service" },
                        { nom: "Paramètres de livraison", definition: "Zones de livraison et frais associés" },
                        { nom: "Gestion des promotions", definition: "Créer des codes promo et offres spéciales" }
                    ]
                },
                {
                    titre: "Intégrations externes",
                    options: [
                        { nom: "Intégration WhatsApp Business", definition: "Envoyer des messages automatiques via WhatsApp" },
                        { nom: "Intégration SMS", definition: "Envoi de SMS via une passerelle locale" },
                        { nom: "Intégration Mobile Money", definition: "Connexion aux APIs MTN et Airtel" },
                        { nom: "Google Maps", definition: "Localisation pour la livraison à domicile" },
                        { nom: "Imprimante thermique", definition: "Impression des tickets et étiquettes" }
                    ]
                },
                {
                    titre: "Aspects techniques",
                    options: [
                        { nom: "Mode hors-ligne", definition: "Fonctionnement sans connexion internet" },
                        { nom: "Synchronisation cloud", definition: "Sauvegarde automatique des données en ligne" },
                        { nom: "Multi-succursales", definition: "Gérer plusieurs points de pressing" },
                        { nom: "Sauvegarde automatique", definition: "Backup quotidien des données" },
                        { nom: "Optimisé 3G", definition: "Application légère pour connexions lentes" }
                    ]
                }
            ]
        },
        structuration_projet: {
            titre: "Structuration de projet - Pressing",
            sections: [
                {
                    titre: "Étude de marché",
                    options: [
                        { nom: "Analyse de la demande locale", definition: "Évaluer le besoin en services de pressing dans la zone" },
                        { nom: "Identification de la clientèle cible", definition: "Définir le profil des clients potentiels (particuliers, entreprises, hôtels)" },
                        { nom: "Étude des prix du marché", definition: "Analyser les tarifs pratiqués par la concurrence" },
                        { nom: "Zones à forte demande", definition: "Identifier les quartiers avec le plus de potentiel" },
                        { nom: "Saisonnalité", definition: "Comprendre les périodes de forte et faible activité" }
                    ]
                },
                {
                    titre: "Analyse de la concurrence",
                    options: [
                        { nom: "Cartographie des concurrents", definition: "Lister tous les pressings existants dans la zone" },
                        { nom: "Points forts des concurrents", definition: "Identifier ce qu'ils font bien" },
                        { nom: "Points faibles des concurrents", definition: "Identifier les opportunités à exploiter" },
                        { nom: "Positionnement différenciant", definition: "Définir ce qui rendra votre pressing unique" },
                        { nom: "Veille concurrentielle", definition: "Suivre les évolutions du marché" }
                    ]
                },
                {
                    titre: "Aspects juridiques et administratifs",
                    options: [
                        { nom: "Création d'entreprise", definition: "Choisir le statut juridique (SARL, entreprise individuelle)" },
                        { nom: "Registre de commerce", definition: "Immatriculation au registre du commerce" },
                        { nom: "Numéro d'identification fiscale", definition: "Obtenir le NIF auprès des impôts" },
                        { nom: "Autorisation d'exploitation", definition: "Permis d'exercer l'activité de pressing" },
                        { nom: "Normes environnementales", definition: "Respect des règles sur les produits chimiques et rejets" },
                        { nom: "Assurance professionnelle", definition: "Assurance responsabilité civile et dommages" }
                    ]
                },
                {
                    titre: "Financement et budget",
                    options: [
                        { nom: "Budget d'investissement initial", definition: "Calculer le coût total pour démarrer (local, équipements, stock)" },
                        { nom: "Fonds de roulement", definition: "Prévoir la trésorerie pour les 3-6 premiers mois" },
                        { nom: "Sources de financement", definition: "Fonds propres, prêt bancaire, investisseurs" },
                        { nom: "Prévisionnel financier", definition: "Projection des revenus et dépenses sur 3 ans" },
                        { nom: "Seuil de rentabilité", definition: "Calculer le nombre de clients nécessaires pour être rentable" },
                        { nom: "Plan de trésorerie", definition: "Suivi mensuel des entrées et sorties d'argent" }
                    ]
                },
                {
                    titre: "Local et emplacement",
                    options: [
                        { nom: "Choix du quartier", definition: "Zone résidentielle, commerciale ou mixte" },
                        { nom: "Superficie nécessaire", definition: "Espace pour machines, comptoir, stockage (minimum 50m²)" },
                        { nom: "Accessibilité", definition: "Facilité d'accès pour les clients (parking, transport)" },
                        { nom: "Visibilité", definition: "Emplacement visible depuis la rue principale" },
                        { nom: "Bail commercial", definition: "Négociation du contrat de location" },
                        { nom: "Aménagement du local", definition: "Travaux, peinture, électricité, plomberie" }
                    ]
                },
                {
                    titre: "Équipement et matériel",
                    options: [
                        { nom: "Machines à laver professionnelles", definition: "Lave-linge industriel grande capacité" },
                        { nom: "Sèche-linge professionnel", definition: "Séchoir industriel rapide" },
                        { nom: "Table et fer à repasser pro", definition: "Équipement de repassage professionnel avec vapeur" },
                        { nom: "Machine pressing", definition: "Presse pour chemises, pantalons, costumes" },
                        { nom: "Comptoir et caisse", definition: "Mobilier de réception et système de caisse" },
                        { nom: "Portants et cintres", definition: "Stockage des vêtements prêts" },
                        { nom: "Produits de nettoyage", definition: "Stock initial de détergents et produits spéciaux" },
                        { nom: "Emballages", definition: "Housses, sacs, cintres pour la livraison" }
                    ]
                },
                {
                    titre: "Ressources humaines",
                    options: [
                        { nom: "Définition des postes", definition: "Identifier les rôles nécessaires (gérant, laveur, repasseur, livreur)" },
                        { nom: "Recrutement", definition: "Processus de sélection du personnel" },
                        { nom: "Formation du personnel", definition: "Former aux techniques de lavage et service client" },
                        { nom: "Grille salariale", definition: "Définir les salaires selon les postes" },
                        { nom: "Planning de travail", definition: "Organisation des horaires et rotations" },
                        { nom: "Règlement intérieur", definition: "Règles de conduite et procédures" }
                    ]
                },
                {
                    titre: "Fournisseurs et partenaires",
                    options: [
                        { nom: "Fournisseur de produits chimiques", definition: "Détergents, adoucissants, détachants professionnels" },
                        { nom: "Fournisseur d'équipements", definition: "Machines et pièces de rechange" },
                        { nom: "Fournisseur d'emballages", definition: "Housses, sacs, cintres en gros" },
                        { nom: "Maintenance machines", definition: "Contrat de maintenance préventive" },
                        { nom: "Partenariat hôtels", definition: "Contrats avec les hôtels de la zone" },
                        { nom: "Partenariat entreprises", definition: "Contrats avec les entreprises pour leurs employés" }
                    ]
                },
                {
                    titre: "Marketing et communication",
                    options: [
                        { nom: "Nom et logo", definition: "Création de l'identité visuelle du pressing" },
                        { nom: "Enseigne lumineuse", definition: "Panneau visible depuis la rue" },
                        { nom: "Flyers et affiches", definition: "Distribution dans le quartier" },
                        { nom: "Page Facebook", definition: "Présence sur les réseaux sociaux" },
                        { nom: "WhatsApp Business", definition: "Numéro professionnel pour les commandes" },
                        { nom: "Offre de lancement", definition: "Promotion pour les premiers clients" },
                        { nom: "Parrainage clients", definition: "Récompenser les clients qui recommandent" }
                    ]
                },
                {
                    titre: "Planification et lancement",
                    options: [
                        { nom: "Rétro-planning", definition: "Calendrier détaillé jusqu'à l'ouverture" },
                        { nom: "Phase de test", definition: "Période d'essai avec clients proches" },
                        { nom: "Inauguration", definition: "Événement d'ouverture officielle" },
                        { nom: "Objectifs mensuels", definition: "Cibles de chiffre d'affaires et clients" },
                        { nom: "Indicateurs de suivi", definition: "KPIs pour mesurer la performance" },
                        { nom: "Plan d'amélioration", definition: "Ajustements après les premiers mois" }
                    ]
                }
            ]
        }
    }
};
