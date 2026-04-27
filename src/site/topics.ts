// Pesce — topic taxonomy. Each topic has a slug, short label, longer
// description used by the template's argomento/[topic] pages.
export const TOPICS = [
  {
    slug: 'pesca-sostenibile',
    label: 'Pesca sostenibile',
    description: 'Stato degli stock ittici, certificazioni MSC e ASC, pratiche di pesca artigianale e industriale, quote UE/GFCM e cosa cambia anno per anno.',
  },
  {
    slug: 'mercato-del-pesce',
    label: 'Mercato del pesce',
    description: 'Filiera, aste, prezzi al banco, etichettatura, importazioni e provenienza. Cosa guardare al mercato per scegliere meglio.',
  },
  {
    slug: 'specie-italiane',
    label: 'Specie italiane',
    description: 'Schede pratiche per chi compra: alici, sarde, pesce azzurro, demersali, molluschi e crostacei dei mari italiani — stagionalità inclusa.',
  },
  {
    slug: 'acquacoltura',
    label: 'Acquacoltura',
    description: 'Allevamento di pesce in Italia: branzino, orata, trota, mitili. Differenze con il selvaggio, qualità, criticità ambientali.',
  },
  {
    slug: 'sicurezza-alimentare',
    label: 'Sicurezza alimentare',
    description: 'Richiami, contaminanti, allergeni, conservazione corretta, regole di base per l\'acquisto del pesce fresco e surgelato.',
  },
  {
    slug: 'normativa',
    label: 'Normativa',
    description: 'Regolamenti UE, GFCM, Stato italiano. Quote, taglie minime, obblighi di etichettatura, controlli ufficiali sulla filiera.',
  },
] as const;

export type TopicSlug = (typeof TOPICS)[number]['slug'];
