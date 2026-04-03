# Diagramme de Cas d'Utilisation — Faymoos

## Acteurs

| Acteur | Description |
|--------|-------------|
| **Visiteur** | Utilisateur non authentifié |
| **Utilisateur** | Utilisateur authentifié (rôle USER) |
| **Affiliateur** | Partenaire qui travaille avec des clients, crée des capsules et gère les objectifs premium payants |
| **Administrateur** | Gestion globale de la plateforme (rôle ADMIN) |
| **Système (IA)** | Services automatisés (OpenAI, notifications, analytics) |

---

## Cas d'utilisation par acteur

### Visiteur
1. Visiteur **consulte** la page d'accueil
2. Visiteur **explore** les identités et capsules publiques
3. Visiteur **visualise** une capsule interactive (branching)
4. Visiteur **clique** sur une option de capsule
5. Visiteur **clique** sur un CTA (call-to-action)
6. Visiteur **envoie** un message via le formulaire de contact
7. Visiteur **consulte** le portfolio d'une identité
8. Visiteur **consulte** les témoignages d'une identité
9. Visiteur **télécharge** le PDF d'une capsule
10. Visiteur **génère** un QR code pour partager une capsule
11. Visiteur **discute** avec le chatbot IA d'une identité
12. Visiteur **s'inscrit** sur la plateforme
13. Visiteur **se connecte** à son compte

### Utilisateur (hérite de Visiteur)
14. Utilisateur **se déconnecte**
15. Utilisateur **crée** un profil d'identité (Freelancer/Agency/Creator/Startup)
16. Utilisateur **modifie** son profil d'identité (nom, bio, headline, avatar, cover, thème, liens sociaux)
17. Utilisateur **supprime** un profil d'identité
18. Utilisateur **crée** une capsule (titre, objectif)
19. Utilisateur **modifie** une capsule
20. Utilisateur **supprime** une capsule
21. Utilisateur **ajoute** une option à une capsule
22. Utilisateur **modifie** une option de capsule
23. Utilisateur **supprime** une option de capsule
24. Utilisateur **crée** une branche (headline, description, CTA, preuve)
25. Utilisateur **modifie** une branche
26. Utilisateur **supprime** une branche
27. Utilisateur **ajoute** un projet au portfolio
28. Utilisateur **modifie** un projet du portfolio
29. Utilisateur **supprime** un projet du portfolio
30. Utilisateur **ajoute** un témoignage
31. Utilisateur **modifie** un témoignage
32. Utilisateur **supprime** un témoignage
33. Utilisateur **consulte** ses analytics (sessions, taux de complétion, clics CTA)
34. Utilisateur **consulte** ses messages reçus
35. Utilisateur **marque** un message comme lu/non lu
36. Utilisateur **supprime** un message
37. Utilisateur **ajoute** une capsule aux favoris
38. Utilisateur **supprime** une capsule des favoris
39. Utilisateur **consulte** ses capsules favorites
40. Utilisateur **consulte** ses notifications
41. Utilisateur **marque** une notification comme lue
42. Utilisateur **supprime** une notification
43. Utilisateur **téléverse** une image (avatar/cover/portfolio)
44. Utilisateur **demande** l'amélioration d'un texte par l'IA
45. Utilisateur **demande** la génération automatique d'une capsule par l'IA

### Affiliateur (nouveau rôle - hérite de Utilisateur)
46. Affiliateur **gère** des comptes clients (créer, modifier, consulter)
47. Affiliateur **crée** des capsules pour le compte d'un client
48. Affiliateur **modifie** les capsules des clients affiliés
49. Affiliateur **supprime** les capsules des clients affiliés
50. Affiliateur **crée** des objectifs premium payants pour un client
51. Affiliateur **modifie** un objectif premium
52. Affiliateur **supprime** un objectif premium
53. Affiliateur **consulte** les analytics des capsules de ses clients
54. Affiliateur **consulte** le tableau de bord affiliateur (liste clients, revenus, performance)
55. Affiliateur **gère** les abonnements premium des clients
56. Affiliateur **génère** des rapports de performance pour ses clients
57. Affiliateur **invite** un nouveau client sur la plateforme
58. Affiliateur **associe** un client à son compte affiliateur

### Administrateur (hérite de Utilisateur)
59. Administrateur **consulte** les statistiques globales de la plateforme
60. Administrateur **gère** tous les utilisateurs (consulter, modifier rôle, supprimer)
61. Administrateur **gère** toutes les capsules de la plateforme
62. Administrateur **gère** les affiliateurs (approuver, suspendre)
63. Administrateur **consulte** les revenus premium globaux

### Système (IA / Backend)
64. Système **enregistre** les événements analytics (START, OPTION_CLICK, CTA_CLICK)
65. Système **envoie** une notification lors d'un clic CTA
66. Système **envoie** une notification lors d'un nouveau message
67. Système **améliore** un texte via OpenAI (GPT-4o-mini)
68. Système **génère** une structure de capsule via OpenAI
69. Système **répond** aux questions du visiteur via le chatbot IA
70. Système **hash** le mot de passe lors de l'inscription (bcrypt)
71. Système **vérifie** l'authentification via cookie de session

---

## Relations importantes (include / extend / generalization)

### «include»
- "Visualiser une capsule" **include** "Enregistrer événement analytics"
- "Cliquer sur un CTA" **include** "Envoyer notification CTA_CLICK"
- "Envoyer message contact" **include** "Envoyer notification NEW_MESSAGE"
- "S'inscrire" **include** "Créer profil d'identité"
- "S'inscrire" **include** "Hasher mot de passe"

### «extend»
- "Créer capsule" **extend** "Générer capsule par IA"
- "Modifier capsule" **extend** "Améliorer texte par IA"
- "Visualiser capsule" **extend** "Télécharger PDF"
- "Visualiser capsule" **extend** "Générer QR code"
- "Visualiser capsule" **extend** "Discuter avec chatbot IA"
- "Créer capsule pour client" **extend** "Créer objectif premium payant"

### «generalization»
- Utilisateur **hérite de** Visiteur
- Affiliateur **hérite de** Utilisateur
- Administrateur **hérite de** Utilisateur
