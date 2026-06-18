import type { ReactNode } from "react";

type ErrorBoundaryProps = {
  children: ReactNode;
  fallback?: ReactNode;
};

export const ErrorBoundary = ({ children, fallback }: ErrorBoundaryProps) => {
  try {
    return <>{children}</>;
  } catch (error) {
    console.error("Safe render caught:", error);
    return fallback ?? (
      <div className="min-h-screen flex items-center justify-center bg-red-950 text-white p-6">
        <div className="max-w-md rounded-2xl bg-white/10 p-6">
          <h1 className="text-xl font-bold mb-2">Что-то пошло не так</h1>
          <p className="text-sm opacity-80">Приложение осталось запущено, но часть интерфейса не смогла отрисоваться.</p>
        </div>
      </div>
    );
  }
};
