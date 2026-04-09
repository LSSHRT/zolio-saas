import { use } from "react";
import { DevisEditor } from "@/components/devis-editor";

export default function EditDevisPage({ params }: { params: Promise<{ numero: string }> }) {
  const { numero } = use(params);
  return <DevisEditor numero={numero} />;
}
