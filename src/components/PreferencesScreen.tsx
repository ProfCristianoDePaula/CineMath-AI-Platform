import React, { useEffect, useState } from 'react';
import { api } from '../services/api';
import { UserPreferences } from '../types';

interface HistoryItem {
  id: string;
  title: string;
  interactionType: string;
  createdAt: string;
}

interface PreferencesScreenProps {
  preferences: UserPreferences | null;
  onSave: (updates: Partial<UserPreferences>) => Promise<void>;
}

const genres = [
  'Ação', 'Animação', 'Aventura', 'Comédia', 'Crime', 'Documentário', 'Drama',
  'Fantasia', 'Ficção Científica', 'Mistério', 'Romance', 'Suspense', 'Terror',
];
const providers = ['Netflix', 'Prime Video', 'Disney+', 'Max', 'Apple TV+', 'Paramount+', 'Globoplay'];
const restrictions = ['Terror', 'Violência', 'Conteúdo adulto'];

export const PreferencesScreen: React.FC<PreferencesScreenProps> = ({ preferences, onSave }) => {
  const [draft, setDraft] = useState<UserPreferences | null>(preferences);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [status, setStatus] = useState('');
  const [error, setError] = useState('');

  useEffect(() => setDraft(preferences), [preferences]);
  useEffect(() => {
    api.getHistory().then(setHistory).catch((requestError: unknown) => {
      setError(requestError instanceof Error ? requestError.message : 'Não foi possível carregar o histórico.');
    });
  }, []);

  if (!draft) {
    return <div className="mx-auto max-w-4xl px-4 py-16 text-center text-sm text-[#958ea0]">Carregando preferências...</div>;
  }

  const toggle = (field: 'favoriteGenres' | 'rejectedGenres' | 'streamingProviders' | 'contentRestrictions', value: string) => {
    const current = draft[field];
    setDraft({ ...draft, [field]: current.includes(value) ? current.filter((item) => item !== value) : [...current, value] });
  };

  const save = async (updates: Partial<UserPreferences> = draft) => {
    setError('');
    setStatus('');
    if (updates.preferredYearRange && !/^(19|20)\d{2}(?:\s*-\s*(?:19|20)\d{2})?$/.test(updates.preferredYearRange)) {
      setError('Informe um ano (2020) ou período no formato AAAA-AAAA (2010-2020).');
      return;
    }
    if (updates.preferredYearRange) {
      const years = updates.preferredYearRange.match(/\d{4}/g)?.map(Number) || [];
      if (years.length === 2 && years[0] > years[1]) {
        setError('O ano inicial deve ser menor ou igual ao ano final.');
        return;
      }
    }
    setIsSaving(true);
    try {
      await onSave(updates);
      setStatus('Preferências salvas.');
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Não foi possível salvar as preferências.');
    } finally {
      setIsSaving(false);
    }
  };

  const reset = () => {
    const defaults: UserPreferences = {
      ...draft,
      favoriteGenres: [],
      rejectedGenres: [],
      streamingProviders: [],
      preferredContentType: 'all',
      preferredDuration: 'any',
      preferredLanguage: 'any',
      preferredYearRange: '',
      contentRestrictions: [],
      familyFriendly: false,
    };
    setDraft(defaults);
    void save(defaults);
  };

  const toggleGrid = (
    title: string,
    field: 'favoriteGenres' | 'rejectedGenres' | 'streamingProviders' | 'contentRestrictions',
    values: string[],
  ) => (
    <fieldset className="space-y-3">
      <legend className="text-sm font-bold text-white">{title}</legend>
      <div className="flex flex-wrap gap-2">
        {values.map((value) => {
          const selected = draft[field].includes(value);
          return (
            <button
              type="button"
              key={value}
              onClick={() => toggle(field, value)}
              className={`rounded-full border px-3 py-1.5 text-xs transition-colors ${selected
                ? 'border-primary bg-primary/20 text-white'
                : 'border-white/10 bg-[#12131d] text-[#cbc3d7]'}`}
              aria-pressed={selected}
            >
              {value}
            </button>
          );
        })}
      </div>
    </fieldset>
  );

  return (
    <div className="mx-auto w-full max-w-5xl px-4 sm:px-6 lg:px-8 py-10 pb-20">
      <div className="mb-8">
        <p className="text-xs font-bold uppercase tracking-wider text-primary">Personalização</p>
        <h1 className="mt-1 text-3xl font-extrabold text-white">Preferências</h1>
        <p className="mt-2 text-sm text-[#cbc3d7]">Esses filtros são usados para personalizar suas próximas recomendações.</p>
      </div>

      {error && <p role="alert" className="mb-4 rounded-xl border border-[#ffb4ab]/30 bg-[#ffb4ab]/10 p-3 text-sm text-[#ffb4ab]">{error}</p>}
      {status && <p role="status" className="mb-4 text-sm text-[#4edea3]">{status}</p>}

      <div className="space-y-5">
        <section className="space-y-6 rounded-2xl border border-white/10 bg-[#1e1f29] p-5 sm:p-7">
          {toggleGrid('Gêneros favoritos', 'favoriteGenres', genres)}
          {toggleGrid('Gêneros a evitar', 'rejectedGenres', genres)}
          {toggleGrid('Serviços assinados', 'streamingProviders', providers)}
          {toggleGrid('Restrições de conteúdo', 'contentRestrictions', restrictions)}
          <p className="text-xs text-[#958ea0]">
            Restrições são aplicadas com base nos gêneros, sinopses e classificações informados pelo TMDB; esses metadados podem não identificar todo conteúdo sensível.
          </p>
        </section>

        <section className="grid gap-5 rounded-2xl border border-white/10 bg-[#1e1f29] p-5 sm:grid-cols-2 sm:p-7">
          <label className="space-y-2 text-sm font-bold text-white">
            Tipo de conteúdo
            <select
              value={draft.preferredContentType}
              onChange={(event) => setDraft({ ...draft, preferredContentType: event.target.value as UserPreferences['preferredContentType'] })}
              className="block w-full rounded-xl border border-white/10 bg-[#12131d] p-3 text-sm text-white"
            >
              <option value="all">Filmes e séries</option>
              <option value="movie">Filmes</option>
              <option value="tv">Séries</option>
            </select>
          </label>
          <label className="space-y-2 text-sm font-bold text-white">
            Duração preferida
            <select
              value={draft.preferredDuration}
              onChange={(event) => setDraft({ ...draft, preferredDuration: event.target.value as UserPreferences['preferredDuration'] })}
              className="block w-full rounded-xl border border-white/10 bg-[#12131d] p-3 text-sm text-white"
            >
              <option value="any">Sem preferência</option>
              <option value="short">Até 90 minutos</option>
              <option value="standard">90 a 120 minutos</option>
              <option value="epic">Mais de 2 horas</option>
            </select>
          </label>
          <label className="space-y-2 text-sm font-bold text-white">
            Idioma original preferido
            <select
              value={draft.preferredLanguage}
              onChange={(event) => setDraft({ ...draft, preferredLanguage: event.target.value })}
              className="block w-full rounded-xl border border-white/10 bg-[#12131d] p-3 text-sm text-white"
            >
              <option value="any">Sem preferência</option>
              <option value="pt-BR">Português (Brasil)</option>
              <option value="en-US">Inglês</option>
              <option value="es-ES">Espanhol</option>
            </select>
          </label>
          <label className="space-y-2 text-sm font-bold text-white">
            Ano ou período
            <input
              value={draft.preferredYearRange || ''}
              onChange={(event) => setDraft({ ...draft, preferredYearRange: event.target.value })}
              placeholder="Ex.: 2020 ou 2010-2020"
              className="block w-full rounded-xl border border-white/10 bg-[#12131d] p-3 text-sm text-white placeholder:text-[#958ea0]"
            />
          </label>
          <label className="sm:col-span-2 flex items-center gap-3 text-sm text-white">
            <input
              type="checkbox"
              checked={draft.familyFriendly}
              onChange={(event) => setDraft({ ...draft, familyFriendly: event.target.checked })}
              className="h-4 w-4 accent-[#a078ff]"
            />
            Mostrar somente títulos com classificação livre ou até 10 anos
          </label>
          <p className="sm:col-span-2 text-xs text-[#958ea0]">
            Títulos sem classificação etária brasileira confirmada ficam de fora quando este filtro está ativo.
          </p>
        </section>

        <section className="rounded-2xl border border-white/10 bg-[#1e1f29] p-5 sm:p-7">
          <h2 className="text-base font-bold text-white">Histórico recente</h2>
          {history.length === 0
            ? <p className="mt-3 text-sm text-[#958ea0]">Nenhuma atividade registrada.</p>
            : <ul className="mt-3 divide-y divide-white/5">
                {history.slice(0, 10).map((item) => (
                  <li key={item.id} className="flex justify-between gap-4 py-3 text-xs">
                    <span className="text-[#e2e1f0]">{item.title || 'Título do catálogo'} · {item.interactionType.replace('_', ' ')}</span>
                    <time className="shrink-0 text-[#958ea0]">{new Date(item.createdAt).toLocaleDateString('pt-BR')}</time>
                  </li>
                ))}
              </ul>}
        </section>
      </div>

      <div className="mt-6 flex flex-wrap justify-between gap-3">
        <button type="button" onClick={reset} disabled={isSaving} className="rounded-xl border border-white/10 px-4 py-3 text-sm text-[#cbc3d7] disabled:opacity-50">
          Redefinir preferências
        </button>
        <button type="button" onClick={() => void save()} disabled={isSaving} className="rounded-xl bg-[#a078ff] px-6 py-3 text-sm font-bold text-white disabled:opacity-50">
          {isSaving ? 'Salvando...' : 'Salvar preferências'}
        </button>
      </div>
    </div>
  );
};
