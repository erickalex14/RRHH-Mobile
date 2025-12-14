export type DocumentType = "cv" | "certificate" | "id" | "other";

export const documentTypeLabels: Record<DocumentType, string> = {
  cv: "CV",
  certificate: "Certificado",
  id: "Identificación",
  other: "Otro"
};
