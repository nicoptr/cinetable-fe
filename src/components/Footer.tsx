export function Footer() {
  return (
    <footer className="mt-12 border-t border-line py-6 text-sm text-muted group-has-[[data-landing]]:hidden">
      <p>
        Dati dei film forniti da{" "}
        <a href="https://www.themoviedb.org/" target="_blank" rel="noopener noreferrer" className="text-gold underline underline-offset-4">
          TMDB
        </a>
      </p>
      <p className="mt-1">This product uses the TMDB API but is not endorsed or certified by TMDB.</p>
    </footer>
  );
}
