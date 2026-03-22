export interface Client {
  id: string;
  nom: string;
  email: string;
  telephone: string;
  adresse: string;
  dateAjout: string;
}

export interface Prestation {
  id: string;
  categorie: string;
  nom: string;
  unite: string;
  prix: number;
  cout: number;
}

export interface LigneDevis {
  nomPrestation: string;
  quantite: number;
  unite: string;
  prixUnitaire: number;
  totalLigne: number;
  tva?: string;
  isOptional?: boolean;
}

export interface GeneratedAILine {
  designation: string;
  quantite: number;
  unite: string;
  prixUnitaire: number;
}

export interface GenerateDevisResponse {
  error?: string;
  lignes?: GeneratedAILine[];
}

export interface DevisResult {
  numero?: string;
  totalTTC?: string | number;
  emailSent?: boolean;
  emailSkippedReason?: string;
}

export interface QuickClientForm {
  nom: string;
  email: string;
  telephone: string;
  adresse: string;
}

export type CreateDevisMode = "save" | "send";
