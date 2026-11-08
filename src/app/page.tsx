"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Carregando } from "@/components/ui/pecas";
import { useArmazem } from "@/lib/demo/armazem";

export default function Inicio() {
  const router = useRouter();
  const { pronto, sessao } = useArmazem();

  useEffect(() => {
    if (!pronto) return;
    router.replace(sessao?.tipo === "admin" ? "/painel" : sessao?.tipo === "familia" ? "/minha-area" : "/login");
  }, [pronto, sessao, router]);

  return <Carregando />;
}
