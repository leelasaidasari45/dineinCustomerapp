-- Create trigger function to automatically calculate average restaurant rating from customer reviews
CREATE OR REPLACE FUNCTION update_restaurant_average_rating()
RETURNS TRIGGER AS $$
DECLARE
  avg_rating NUMERIC(3,2);
BEGIN
  -- We trigger when is_rated changes to true, or any rating gets updated
  IF (NEW.is_rated = TRUE AND (OLD.is_rated = FALSE OR OLD.is_rated IS NULL OR OLD.rating_restaurant IS DISTINCT FROM NEW.rating_restaurant)) THEN
    
    -- Calculate average of rating_restaurant from all orders of the given restaurant
    SELECT ROUND(AVG(rating_restaurant)::numeric, 1)
    INTO avg_rating
    FROM orders
    WHERE restaurant_id = NEW.restaurant_id
      AND is_rated = TRUE
      AND rating_restaurant IS NOT NULL;

    -- Update the corresponding restaurant record
    IF avg_rating IS NOT NULL THEN
      UPDATE restaurants
      SET rating = avg_rating
      WHERE id = NEW.restaurant_id;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create/Replace the trigger on update
DROP TRIGGER IF EXISTS tr_update_restaurant_rating ON orders;
CREATE TRIGGER tr_update_restaurant_rating
AFTER UPDATE ON orders
FOR EACH ROW
EXECUTE FUNCTION update_restaurant_average_rating();

-- Recalculate rating averages for all restaurants based on existing orders
UPDATE restaurants r
SET rating = COALESCE(
  (
    SELECT ROUND(AVG(rating_restaurant)::numeric, 1)
    FROM orders o
    WHERE o.restaurant_id = r.id
      AND o.is_rated = TRUE
      AND o.rating_restaurant IS NOT NULL
  ),
  4.0
);
