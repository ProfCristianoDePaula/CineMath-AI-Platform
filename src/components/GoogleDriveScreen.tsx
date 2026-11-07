import React, { useState, useEffect } from 'react';
import { User } from 'firebase/auth';
import { Movie } from '../types';
import {
  listCineMatchDriveFiles,
  exportWatchlistToDrive,
  exportMovieDossierToDrive,
  deleteDriveFile,
  DriveFileItem,
} from '../services/drive';
import { googleSignIn, logout } from '../services/auth';

interface GoogleDriveScreenProps {
  user: User | null;
  accessToken: string | null;
  onAuthSuccess: (user: User, token: string) => void;
  onLogout: () => void;
  movies: Movie[];
  watchlistIds: string[];
  watchedIds: string[];
  onSelectMovie: (movie: Movie) => void;
}

export const GoogleDriveScreen: React.FC<GoogleDriveScreenProps> = ({
  user,
  accessToken,
  onAuthSuccess,
  onLogout,
  movies,
  watchlistIds,
  watchedIds,
  onSelectMovie,
}) => {
  const [driveFiles, setDriveFiles] = useState<DriveFileItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Confirmation dialog state for file deletion (MANDATORY per skill)
  const [fileToDelete, setFileToDelete] = useState<DriveFileItem | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchFiles = async () => {
    if (!accessToken) return;
    setIsLoading(true);
    try {
      const files = await listCineMatchDriveFiles(accessToken);
      setDriveFiles(files);
    } catch (err: any) {
      console.error(err);
      setNotification({
        type: 'error',
        message: err.message || 'Falha ao buscar arquivos do Google Drive.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (accessToken) {
      fetchFiles();
    }
  }, [accessToken]);

  const handleLogin = async () => {
    setIsLoading(true);
    setNotification(null);
    try {
      const result = await googleSignIn();
      if (result) {
        onAuthSuccess(result.user, result.accessToken);
        setNotification({
          type: 'success',
          message: `Conectado com sucesso como ${result.user.displayName || result.user.email}!`,
        });
      }
    } catch (err: any) {
      setNotification({
        type: 'error',
        message: err.message || 'Não foi possível concluir o login com o Google.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleExportWatchlist = async () => {
    if (!accessToken) return;
    setIsExporting(true);
    setNotification(null);
    try {
      const file = await exportWatchlistToDrive(accessToken, movies, watchlistIds, watchedIds);
      setNotification({
        type: 'success',
        message: `Lista exportada com sucesso para o Google Drive: "${file.name}"!`,
      });
      await fetchFiles();
    } catch (err: any) {
      setNotification({
        type: 'error',
        message: err.message || 'Falha ao exportar lista para o Google Drive.',
      });
    } finally {
      setIsExporting(false);
    }
  };

  const handleExportDossier = async (movie: Movie) => {
    if (!accessToken) return;
    setIsExporting(true);
    setNotification(null);
    try {
      const file = await exportMovieDossierToDrive(accessToken, movie);
      setNotification({
        type: 'success',
        message: `Dossiê cinematográfico de "${movie.title}" salvo no seu Google Drive: "${file.name}"!`,
      });
      await fetchFiles();
    } catch (err: any) {
      setNotification({
        type: 'error',
        message: err.message || 'Falha ao exportar dossiê para o Google Drive.',
      });
    } finally {
      setIsExporting(false);
    }
  };

  const confirmDeleteFile = async () => {
    if (!accessToken || !fileToDelete) return;
    setIsDeleting(true);
    try {
      await deleteDriveFile(accessToken, fileToDelete.id);
      setNotification({
        type: 'success',
        message: `Arquivo "${fileToDelete.name}" removido do seu Google Drive.`,
      });
      setFileToDelete(null);
      await fetchFiles();
    } catch (err: any) {
      setNotification({
        type: 'error',
        message: err.message || 'Falha ao excluir arquivo do Google Drive.',
      });
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 relative z-10 pb-20">
      {/* Background glow */}
      <div className="pointer-events-none absolute top-10 left-1/2 -translate-x-1/2 w-[60rem] h-[30rem] bg-gradient-to-b from-[#a078ff]/15 via-[#4285F4]/15 to-transparent blur-[120px] -z-10"></div>

      {/* Screen Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8 pb-4 border-b border-white/5">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#4285F4]/20 text-[#8ab4f8] text-xs font-bold uppercase tracking-wider mb-2 border border-[#4285F4]/30">
            <span className="material-symbols-outlined text-sm">cloud</span>
            Integração Google Workspace
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight flex items-center gap-3">
            <span>Google Drive</span>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-[#4edea3]/20 text-[#4edea3] border border-[#4edea3]/30 font-semibold font-mono">
              Ativo
            </span>
          </h1>
          <p className="text-sm text-[#cbc3d7] mt-1">
            Salve suas recomendações, exporte dossiês analíticos e sincronize sua lista diretamente no seu Google Drive com sua permissão.
          </p>
        </div>

        {user && (
          <button
            onClick={fetchFiles}
            disabled={isLoading}
            className="px-4 py-2.5 rounded-xl bg-[#282934] hover:bg-[#33343f] text-xs font-semibold text-white border border-white/10 flex items-center gap-2 transition-colors cursor-pointer self-start sm:self-auto shrink-0"
          >
            <span className={`material-symbols-outlined text-sm ${isLoading ? 'animate-spin' : ''}`}>
              sync
            </span>
            <span>Atualizar Arquivos</span>
          </button>
        )}
      </div>

      {/* Notification Banner */}
      {notification && (
        <div
          className={`mb-6 p-4 rounded-2xl flex items-center justify-between gap-3 text-xs font-medium border animate-in fade-in ${
            notification.type === 'success'
              ? 'bg-[#4edea3]/15 text-[#4edea3] border-[#4edea3]/30'
              : 'bg-[#ffb4ab]/15 text-[#ffb4ab] border-[#ffb4ab]/30'
          }`}
        >
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-base">
              {notification.type === 'success' ? 'check_circle' : 'error'}
            </span>
            <span>{notification.message}</span>
          </div>
          <button
            onClick={() => setNotification(null)}
            className="p-1 hover:opacity-75 transition-opacity cursor-pointer"
          >
            <span className="material-symbols-outlined text-sm">close</span>
          </button>
        </div>
      )}

      {!user ? (
        /* Unauthenticated State */
        <div className="bg-[#1e1f29] rounded-3xl p-8 sm:p-12 border border-white/10 text-center max-w-2xl mx-auto shadow-2xl relative overflow-hidden">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-[#4285F4] to-[#34A853] flex items-center justify-center text-white mx-auto mb-6 shadow-lg">
            <svg className="w-9 h-9" viewBox="0 0 87.3 78" xmlns="http://www.w3.org/2000/svg">
              <path d="m6.6 66.85 3.85 6.65c.8 1.4 1.95 2.5 3.3 3.3l13.75-23.8h-27.5c0 1.55.4 3.1 1.2 4.5z" fill="#0066da"/>
              <path d="m43.65 25-13.75-23.8c-1.35.8-2.5 1.9-3.3 3.3l-25.4 44c-.8 1.4-1.2 2.95-1.2 4.5h27.5z" fill="#00ac47"/>
              <path d="m73.55 76.8c1.35-.8 2.5-1.9 3.3-3.3l1.6-2.75 7.65-13.25c.8-1.4 1.2-2.95 1.2-4.5h-27.502l5.852 11.5z" fill="#ea4335"/>
              <path d="m43.65 25 13.75-23.8c-1.35-.8-2.9-1.2-4.5-1.2h-18.5c-1.6 0-3.15.45-4.5 1.25z" fill="#00832d"/>
              <path d="m59.8 53h-32.3l-13.75 23.8c1.35.8 2.9 1.2 4.5 1.2h50.8c1.6 0 3.15-.45 4.5-1.2z" fill="#2684fc"/>
              <path d="m73.4 26.5-12.7-22c-.8-1.4-1.95-2.5-3.3-3.3l-13.75 23.8 16.15 28h27.45c0-1.55-.4-3.1-1.2-4.5z" fill="#ffba00"/>
            </svg>
          </div>

          <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight mb-3">
            Conecte sua conta Google Drive
          </h2>
          <p className="text-sm text-[#cbc3d7] mb-8 leading-relaxed max-w-lg mx-auto">
            Ao conectar seu Google Drive, com sua permissão você poderá exportar suas listas de filmes e dossiês analíticos completos com um clique, sincronizando tudo com segurança em nuvem.
          </p>

          {/* Official Google Sign-In Button format */}
          <div className="flex justify-center">
            <button
              onClick={handleLogin}
              disabled={isLoading}
              className="inline-flex items-center gap-3 px-6 py-3.5 rounded-full bg-white text-gray-800 hover:bg-gray-100 font-semibold text-sm shadow-xl hover:shadow-2xl hover:scale-[1.02] active:scale-[0.99] transition-all cursor-pointer border border-gray-200"
            >
              <svg className="w-5 h-5" viewBox="0 0 48 48">
                <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
                <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
                <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
                <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
              </svg>
              <span>{isLoading ? 'Conectando...' : 'Sign in with Google'}</span>
            </button>
          </div>

          <div className="mt-8 pt-6 border-t border-white/5 flex flex-wrap justify-center gap-6 text-xs text-[#958ea0]">
            <span className="flex items-center gap-1.5">
              <span className="text-[#4edea3]">✓</span> Acesso exclusivo aos arquivos criados por este app
            </span>
            <span className="flex items-center gap-1.5">
              <span className="text-[#4edea3]">✓</span> Sem armazenamento de credenciais no navegador
            </span>
            <span className="flex items-center gap-1.5">
              <span className="text-[#4edea3]">✓</span> Revogável a qualquer momento
            </span>
          </div>
        </div>
      ) : (
        /* Authenticated State */
        <div className="space-y-8">
          {/* User Status & Quick Export Toolbar */}
          <div className="bg-[#1e1f29] rounded-3xl p-6 sm:p-8 border border-white/10 shadow-xl flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-4 text-center md:text-left">
              {user.photoURL ? (
                <img
                  src={user.photoURL}
                  alt={user.displayName || 'Google User'}
                  className="w-14 h-14 rounded-full border-2 border-primary object-cover shadow"
                />
              ) : (
                <div className="w-14 h-14 rounded-full bg-primary/20 text-primary flex items-center justify-center font-bold text-xl">
                  {user.displayName?.[0] || 'U'}
                </div>
              )}
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-bold text-white">
                    {user.displayName || 'Usuário Google'}
                  </h3>
                  <span className="px-2 py-0.5 rounded-full bg-[#4edea3]/20 text-[#4edea3] text-[10px] font-bold">
                    Conectado
                  </span>
                </div>
                <p className="text-xs text-[#958ea0]">{user.email}</p>
                <p className="text-[11px] text-primary/80 mt-0.5">Google Drive habilitado com permissão</p>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="flex flex-wrap items-center gap-3">
              <button
                onClick={handleExportWatchlist}
                disabled={isExporting}
                className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#a078ff] to-[#6d3bd7] text-white font-bold text-xs flex items-center gap-2 shadow-[0_0_20px_rgba(160,120,255,0.4)] hover:scale-[1.02] transition-all cursor-pointer disabled:opacity-50"
              >
                <span className="material-symbols-outlined text-sm">upload_file</span>
                <span>{isExporting ? 'Salvando...' : `Salvar Minha Lista (${watchlistIds.length}) no Drive`}</span>
              </button>

              <button
                onClick={() => handleExportDossier(movies[0])}
                disabled={isExporting}
                className="px-4 py-2.5 rounded-xl bg-[#282934] hover:bg-[#33343f] text-[#5de6ff] font-semibold text-xs border border-[#5de6ff]/20 flex items-center gap-2 transition-colors cursor-pointer disabled:opacity-50"
              >
                <span className="material-symbols-outlined text-sm">description</span>
                <span>Salvar Dossiê #1 (Sussurros)</span>
              </button>

              <button
                onClick={() => {
                  logout();
                  onLogout();
                }}
                className="p-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-[#ffb4ab] border border-white/5 transition-colors cursor-pointer"
                title="Desconectar do Google Drive"
              >
                <span className="material-symbols-outlined text-sm">logout</span>
              </button>
            </div>
          </div>

          {/* Files List in Google Drive */}
          <div className="bg-[#1e1f29] rounded-3xl p-6 sm:p-8 border border-white/10 shadow-xl">
            <div className="flex items-center justify-between mb-6 pb-4 border-b border-white/5">
              <div>
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <span className="material-symbols-outlined text-[#4285F4] text-xl">folder_shared</span>
                  Arquivos CineMatch no seu Google Drive
                </h3>
                <p className="text-xs text-[#958ea0]">
                  Documentos, dossiês e listas sincronizados com sua permissão
                </p>
              </div>
              <span className="text-xs font-mono text-[#cbc3d7]">
                {driveFiles.length} arquivo(s)
              </span>
            </div>

            {isLoading ? (
              <div className="py-16 text-center text-xs text-[#958ea0] flex flex-col items-center gap-3">
                <span className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin"></span>
                <span>Consultando Google Drive...</span>
              </div>
            ) : driveFiles.length === 0 ? (
              <div className="py-14 text-center bg-[#12131d]/50 rounded-2xl border border-white/5 p-6">
                <span className="material-symbols-outlined text-4xl text-[#958ea0] mb-2">cloud_off</span>
                <h4 className="text-sm font-bold text-white mb-1">Nenhum arquivo CineMatch encontrado ainda</h4>
                <p className="text-xs text-[#cbc3d7] max-w-md mx-auto mb-5">
                  Clique no botão acima para salvar sua lista atual ou exportar o dossiê cinematográfico do seu filme favorito diretamente para o seu Google Drive.
                </p>
                <button
                  onClick={handleExportWatchlist}
                  className="px-5 py-2.5 rounded-xl bg-[#a078ff] text-white text-xs font-bold hover:bg-[#6d3bd7] transition-colors cursor-pointer"
                >
                  Exportar Minha Lista Agora
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {driveFiles.map((file) => {
                  const isJson = file.mimeType.includes('json') || file.name.endsWith('.json');

                  return (
                    <div
                      key={file.id}
                      className="p-4 rounded-2xl bg-[#12131d] border border-white/5 hover:border-white/15 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 group"
                    >
                      <div className="flex items-center gap-3.5 min-w-0">
                        <div
                          className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                            isJson
                              ? 'bg-[#a078ff]/20 text-primary border border-[#a078ff]/30'
                              : 'bg-[#5de6ff]/20 text-[#5de6ff] border border-[#5de6ff]/30'
                          }`}
                        >
                          <span className="material-symbols-outlined text-xl">
                            {isJson ? 'data_object' : 'description'}
                          </span>
                        </div>

                        <div className="min-w-0">
                          <h4 className="text-sm font-bold text-white truncate group-hover:text-primary transition-colors">
                            {file.name}
                          </h4>
                          <div className="flex items-center gap-2 text-[11px] text-[#958ea0] mt-0.5">
                            <span>
                              Modificado em{' '}
                              {new Date(file.modifiedTime).toLocaleDateString('pt-BR')}{' '}
                              {new Date(file.modifiedTime).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                            </span>
                            <span>•</span>
                            <span className="capitalize">{isJson ? 'Lista JSON' : 'Dossiê de Texto'}</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        {file.webViewLink && (
                          <a
                            href={file.webViewLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-3.5 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-xs font-semibold text-white border border-white/10 flex items-center gap-1.5 transition-colors cursor-pointer"
                          >
                            <span>Abrir no Drive</span>
                            <span className="material-symbols-outlined text-xs">open_in_new</span>
                          </a>
                        )}

                        <button
                          onClick={() => setFileToDelete(file)}
                          className="p-2 rounded-xl text-[#ffb4ab] hover:bg-[#ffb4ab]/10 border border-transparent hover:border-[#ffb4ab]/20 transition-colors cursor-pointer"
                          title="Excluir do Google Drive"
                        >
                          <span className="material-symbols-outlined text-sm">delete</span>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* MANDATORY Confirmation Dialog for Deleting Files in Google Drive */}
      {fileToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in">
          <div className="bg-[#1e1f29] border border-white/10 rounded-3xl max-w-md w-full p-6 shadow-2xl relative">
            <div className="w-12 h-12 rounded-2xl bg-[#ffb4ab]/20 text-[#ffb4ab] flex items-center justify-center mb-4 border border-[#ffb4ab]/30">
              <span className="material-symbols-outlined text-2xl">delete_forever</span>
            </div>

            <h3 className="text-lg font-bold text-white mb-2">
              Excluir arquivo do Google Drive?
            </h3>
            <p className="text-xs text-[#cbc3d7] leading-relaxed mb-4">
              Você tem certeza de que deseja remover permanentemente o arquivo{' '}
              <strong className="text-white">"{fileToDelete.name}"</strong> do seu Google Drive?
              Esta ação não pode ser desfeita.
            </p>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-white/5">
              <button
                onClick={() => setFileToDelete(null)}
                disabled={isDeleting}
                className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-xs font-semibold text-[#cbc3d7] hover:text-white transition-colors cursor-pointer"
              >
                Cancelar
              </button>
              <button
                onClick={confirmDeleteFile}
                disabled={isDeleting}
                className="px-4 py-2 rounded-xl bg-[#ffb4ab] hover:bg-red-400 text-black text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5"
              >
                {isDeleting ? (
                  <>
                    <span className="w-3.5 h-3.5 border-2 border-black border-t-transparent rounded-full animate-spin"></span>
                    <span>Excluindo...</span>
                  </>
                ) : (
                  <>
                    <span className="material-symbols-outlined text-sm">delete</span>
                    <span>Confirmar Exclusão</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
