/**
 * Static error-boundary strings.
 *
 * The root ErrorBoundary must render readable UI even when the async i18n
 * locale cache has not been populated (e.g. a crash during initial load).
 * These strings are therefore bundled synchronously, keyed by language.
 */

import type { SupportedLanguage } from "./i18n";

export type ErrorBoundaryKey =
  | "somethingWentWrong"
  | "appStillRunning"
  | "chunkLoadHint"
  | "errorDetails"
  | "tryAgain"
  | "reloadPage"
  | "loading";

export const ERROR_BOUNDARY_STRINGS: Record<SupportedLanguage, Record<ErrorBoundaryKey, string>> = {
  en: {
    somethingWentWrong: "Something went wrong",
    appStillRunning: "The application is still running, but a part of the UI failed to render.",
    chunkLoadHint: "A part of the interface failed to download. Reload the page to load the latest version.",
    errorDetails: "Error details",
    tryAgain: "Try again",
    reloadPage: "Reload page",
    loading: "Loading...",
  },
  ru: {
    somethingWentWrong: "Что-то пошло не так",
    appStillRunning: "Приложение продолжает работу, но часть интерфейса не загрузилась.",
    chunkLoadHint: "Часть интерфейса не загрузилась. Перезагрузите страницу, чтобы получить актуальную версию.",
    errorDetails: "Подробности ошибки",
    tryAgain: "Попробовать снова",
    reloadPage: "Перезагрузить страницу",
    loading: "Загрузка...",
  },
  de: {
    somethingWentWrong: "Etwas ist schiefgelaufen",
    appStillRunning: "Die Anwendung läuft weiter, aber ein Teil der Oberfläche konnte nicht gerendert werden.",
    chunkLoadHint: "Ein Teil der Oberfläche konnte nicht geladen werden. Laden Sie die Seite neu, um die aktuelle Version zu erhalten.",
    errorDetails: "Fehlerdetails",
    tryAgain: "Erneut versuchen",
    reloadPage: "Seite neu laden",
    loading: "Wird geladen...",
  },
  es: {
    somethingWentWrong: "Algo salió mal",
    appStillRunning: "La aplicación sigue funcionando, pero una parte de la interfaz no se pudo mostrar.",
    chunkLoadHint: "No se pudo descargar una parte de la interfaz. Recarga la página para obtener la versión más reciente.",
    errorDetails: "Detalles del error",
    tryAgain: "Reintentar",
    reloadPage: "Recargar página",
    loading: "Cargando...",
  },
  fr: {
    somethingWentWrong: "Une erreur est survenue",
    appStillRunning: "L'application continue de fonctionner, mais une partie de l'interface n'a pas pu s'afficher.",
    chunkLoadHint: "Une partie de l'interface n'a pas pu se télécharger. Rechargez la page pour obtenir la dernière version.",
    errorDetails: "Détails de l'erreur",
    tryAgain: "Réessayer",
    reloadPage: "Recharger la page",
    loading: "Chargement...",
  },
  zh: {
    somethingWentWrong: "出了点问题",
    appStillRunning: "应用仍在运行，但界面的一部分未能渲染。",
    chunkLoadHint: "部分界面下载失败。请重新加载页面以获取最新版本。",
    errorDetails: "错误详情",
    tryAgain: "重试",
    reloadPage: "重新加载页面",
    loading: "加载中...",
  },
  ja: {
    somethingWentWrong: "問題が発生しました",
    appStillRunning: "アプリは動作を続けていますが、UIの一部を表示できませんでした。",
    chunkLoadHint: "一部のUIの読み込みに失敗しました。最新バージョンを取得するにはページを再読み込みしてください。",
    errorDetails: "エラー詳細",
    tryAgain: "再試行",
    reloadPage: "ページを再読み込み",
    loading: "読み込み中...",
  },
  ko: {
    somethingWentWrong: "문제가 발생했습니다",
    appStillRunning: "앱은 계속 실행 중이지만 UI 일부를 렌더링하지 못했습니다.",
    chunkLoadHint: "일부 UI를 불러오지 못했습니다. 최신 버전을 받으려면 페이지를 새로고침하세요.",
    errorDetails: "오류 세부 정보",
    tryAgain: "다시 시도",
    reloadPage: "페이지 새로고침",
    loading: "로딩 중...",
  },
};

/** Synchronous, cache-independent lookup that never returns a raw i18n key. */
export function getErrorBoundaryString(lang: string, key: ErrorBoundaryKey): string {
  const dict = ERROR_BOUNDARY_STRINGS[lang as SupportedLanguage] ?? ERROR_BOUNDARY_STRINGS.en;
  const bareKey = key.split(".").pop() as ErrorBoundaryKey;
  return dict[bareKey] ?? ERROR_BOUNDARY_STRINGS.en[bareKey] ?? key;
}
