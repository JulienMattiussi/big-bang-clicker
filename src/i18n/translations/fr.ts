/**
 * Traductions françaises (langue source / par défaut). Le type des clés de
 * traduction est dérivé de cet objet : toute clé ajoutée ici devient
 * obligatoire dans les autres langues (voir ../types.ts).
 */
export const fr = {
  'app.complexity': 'Complexité',
  'app.nextGoal': 'Prochain palier',
  'lang.label': 'Langue',
  'nav.eras': 'Ères',

  'ui.buy': 'Améliorer',
  'ui.perSecond': '/s',
  'ui.level': 'niv.',
  'machine.pause': 'Mettre en pause',
  'machine.resume': 'Réactiver',

  'save.title': 'Sauvegarde',
  'save.export': 'Exporter',
  'save.import': 'Importer',
  'save.copy': 'Copier',
  'save.copied': 'Copié !',
  'save.download': 'Télécharger',
  'save.importPlaceholder': 'Colle ici ton code de sauvegarde',
  'save.importError': 'Code de sauvegarde invalide',
  'save.importSuccess': 'Sauvegarde importée',
  'save.reset': 'Réinitialiser',
  'save.resetConfirm': 'Confirmer la réinitialisation ?',

  'res.particule': 'Particules',
  'res.nucleon': 'Nucléons',
  'res.electron': 'Électrons',
  'res.hydrogene': 'Hydrogène',

  'gen.expansion': "Expansion de l'espace",
  'gen.capture': 'Capture électronique',
  'conv.confinement': 'Confinement',
  'conv.recombinaison': 'Recombinaison',

  'era.e0.name': 'Big Bang',
  'era.e0.accroche': "Trop chaud pour exister. Laisse l'univers respirer.",
  'era.e0.stock': 'Matière',
  'era.e0.machines': 'Forces cosmiques',
  'era.e0.verb': 'Refroidir',
  'era.e1.name': 'Recombinaison',
  'era.e1.accroche': 'Les électrons se posent enfin : que la lumière soit.',
  'era.e1.stock': 'Matière',
  'era.e1.machines': 'Phénomènes',
  'era.e1.verb': 'Capturer les électrons',
} as const
