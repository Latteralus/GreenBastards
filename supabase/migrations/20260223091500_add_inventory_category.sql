-- Add category column to inventory table with default value 'Input'
ALTER TABLE public.inventory 
ADD COLUMN category text DEFAULT 'Input';

-- Update existing records to have 'Input' as category (though default should handle this for new ones, this ensures existing ones are set)
UPDATE public.inventory 
SET category = 'Input' 
WHERE category IS NULL;
