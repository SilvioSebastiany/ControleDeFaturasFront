import { useEffect, useState } from 'react';

type Tema = 'light' | 'dark';

const CHAVE_STORAGE = 'tema';

function temaSalvo(): Tema | null {
  try {
    const valor = localStorage.getItem(CHAVE_STORAGE);
    return valor === 'light' || valor === 'dark' ? valor : null;
  } catch {
    return null;
  }
}

function temaPreferidoDoSistema(): Tema {
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

// Toggle manual sobrepondo prefers-color-scheme (ver data-theme em index.css).
// Persiste a escolha; sem escolha salva, parte do tema atual do sistema.
export function useTema() {
  const [tema, setTema] = useState<Tema>(() => temaSalvo() ?? temaPreferidoDoSistema());

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', tema);
    try {
      localStorage.setItem(CHAVE_STORAGE, tema);
    } catch {
      /* localStorage indisponível (modo privado, etc.) — tema só não persiste entre sessões */
    }
  }, [tema]);

  function alternar() {
    setTema((atual) => (atual === 'light' ? 'dark' : 'light'));
  }

  return { tema, alternar };
}
