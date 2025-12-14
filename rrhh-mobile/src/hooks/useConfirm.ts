import { useContext } from "react";
import { ConfirmContext } from "@/providers/ConfirmProvider";

export const useConfirm = () => {
  const context = useContext(ConfirmContext);
  if (!context) {
    throw new Error("useConfirm debe utilizarse dentro de un ConfirmProvider");
  }
  return context.confirm;
};
