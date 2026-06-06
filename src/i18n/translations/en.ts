import type { Translations } from '../types'

/**
 * Traductions anglaises. Doit fournir TOUTES les clés du fichier FR (sinon
 * erreur de type). Pour les références culturelles, utiliser la formulation
 * officielle anglaise, pas une traduction littérale du français (voir
 * docs/NARRATIVE.md, section Localisation).
 */
export const en: Translations = {
  'app.complexity': 'Complexity',
  'app.nextGoal': 'Next milestone',
  'lang.label': 'Language',
  'nav.eras': 'Eras',

  'ui.buy': 'Upgrade',
  'ui.perSecond': '/s',
  'ui.level': 'lvl',
  'machine.pause': 'Pause',
  'machine.resume': 'Resume',

  'save.title': 'Save',
  'save.export': 'Export',
  'save.import': 'Import',
  'save.copy': 'Copy',
  'save.copied': 'Copied!',
  'save.download': 'Download',
  'save.importPlaceholder': 'Paste your save code here',
  'save.importError': 'Invalid save code',
  'save.importSuccess': 'Save imported',
  'save.reset': 'Reset',
  'save.resetConfirm': 'Confirm reset?',

  'res.particule': 'Particles',
  'res.nucleon': 'Nucleons',
  'res.electron': 'Electrons',
  'res.hydrogene': 'Hydrogen',

  'gen.expansion': 'Expansion of space',
  'gen.capture': 'Electron capture',
  'conv.confinement': 'Confinement',
  'conv.recombinaison': 'Recombination',

  'era.e0.name': 'Big Bang',
  'era.e0.accroche': 'Too hot to exist. Let the universe breathe.',
  'era.e0.stock': 'Matter',
  'era.e0.machines': 'Cosmic forces',
  'era.e0.verb': 'Cool down',
  'era.e1.name': 'Recombination',
  'era.e1.accroche': 'Electrons finally settle: let there be light.',
  'era.e1.stock': 'Matter',
  'era.e1.machines': 'Phenomena',
  'era.e1.verb': 'Capture electrons',
}
