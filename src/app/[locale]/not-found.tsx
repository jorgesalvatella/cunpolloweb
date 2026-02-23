import { Link } from "@/i18n/navigation";

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] px-4 text-center">
      <h1 className="text-6xl font-bold text-gold-500 mb-4">404</h1>
      <p className="text-xl text-red-600 mb-8">Página no encontrada</p>
      <Link
        href="/"
        className="bg-gold-500 text-white px-6 py-3 rounded-lg font-semibold hover:bg-gold-600 transition-colors"
      >
        Volver al Inicio
      </Link>
    </div>
  );
}
