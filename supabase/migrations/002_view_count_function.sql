-- Funzione per incrementare contatore visite articolo
CREATE OR REPLACE FUNCTION increment_view_count(article_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE articles SET view_count = view_count + 1 WHERE id = article_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
