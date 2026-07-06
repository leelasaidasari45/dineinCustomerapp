-- Update Shadhab's address to indicate it is located in Hyderabad so that it matches when filtering by Hyderabad
UPDATE restaurants 
SET address = 'High Court Rd, Madina Circle, Charminar, Hyderabad' 
WHERE name = 'Shadhab';
