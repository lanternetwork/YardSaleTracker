-- Add only the missing columns that don't exist
-- This migration will add columns one by one, checking if they exist first

-- Add owner_id column if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'sales' 
        AND column_name = 'owner_id'
    ) THEN
        ALTER TABLE sales ADD COLUMN owner_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
        RAISE NOTICE 'Added owner_id column to sales table';
    ELSE
        RAISE NOTICE 'owner_id column already exists';
    END IF;
END $$;

-- Add created_at column if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'sales' 
        AND column_name = 'created_at'
    ) THEN
        ALTER TABLE sales ADD COLUMN created_at TIMESTAMPTZ DEFAULT NOW();
        RAISE NOTICE 'Added created_at column to sales table';
    ELSE
        RAISE NOTICE 'created_at column already exists';
    END IF;
END $$;

-- Add updated_at column if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'sales' 
        AND column_name = 'updated_at'
    ) THEN
        ALTER TABLE sales ADD COLUMN updated_at TIMESTAMPTZ DEFAULT NOW();
        RAISE NOTICE 'Added updated_at column to sales table';
    ELSE
        RAISE NOTICE 'updated_at column already exists';
    END IF;
END $$;

-- Add status column if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'sales' 
        AND column_name = 'status'
    ) THEN
        ALTER TABLE sales ADD COLUMN status TEXT DEFAULT 'published';
        RAISE NOTICE 'Added status column to sales table';
    ELSE
        RAISE NOTICE 'status column already exists';
    END IF;
END $$;

-- Add date_start column if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'sales' 
        AND column_name = 'date_start'
    ) THEN
        ALTER TABLE sales ADD COLUMN date_start DATE;
        RAISE NOTICE 'Added date_start column to sales table';
    ELSE
        RAISE NOTICE 'date_start column already exists';
    END IF;
END $$;

-- Add time_start column if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'sales' 
        AND column_name = 'time_start'
    ) THEN
        ALTER TABLE sales ADD COLUMN time_start TIME;
        RAISE NOTICE 'Added time_start column to sales table';
    ELSE
        RAISE NOTICE 'time_start column already exists';
    END IF;
END $$;

-- Add date_end column if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'sales' 
        AND column_name = 'date_end'
    ) THEN
        ALTER TABLE sales ADD COLUMN date_end DATE;
        RAISE NOTICE 'Added date_end column to sales table';
    ELSE
        RAISE NOTICE 'date_end column already exists';
    END IF;
END $$;

-- Add time_end column if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'sales' 
        AND column_name = 'time_end'
    ) THEN
        ALTER TABLE sales ADD COLUMN time_end TIME;
        RAISE NOTICE 'Added time_end column to sales table';
    ELSE
        RAISE NOTICE 'time_end column already exists';
    END IF;
END $$;

-- Add description column if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'sales' 
        AND column_name = 'description'
    ) THEN
        ALTER TABLE sales ADD COLUMN description TEXT;
        RAISE NOTICE 'Added description column to sales table';
    ELSE
        RAISE NOTICE 'description column already exists';
    END IF;
END $$;

-- Add address column if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'sales' 
        AND column_name = 'address'
    ) THEN
        ALTER TABLE sales ADD COLUMN address TEXT;
        RAISE NOTICE 'Added address column to sales table';
    ELSE
        RAISE NOTICE 'address column already exists';
    END IF;
END $$;

-- Add city column if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'sales' 
        AND column_name = 'city'
    ) THEN
        ALTER TABLE sales ADD COLUMN city TEXT;
        RAISE NOTICE 'Added city column to sales table';
    ELSE
        RAISE NOTICE 'city column already exists';
    END IF;
END $$;

-- Add state column if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'sales' 
        AND column_name = 'state'
    ) THEN
        ALTER TABLE sales ADD COLUMN state TEXT;
        RAISE NOTICE 'Added state column to sales table';
    ELSE
        RAISE NOTICE 'state column already exists';
    END IF;
END $$;

-- Add lat column if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'sales' 
        AND column_name = 'lat'
    ) THEN
        ALTER TABLE sales ADD COLUMN lat DECIMAL(10, 8);
        RAISE NOTICE 'Added lat column to sales table';
    ELSE
        RAISE NOTICE 'lat column already exists';
    END IF;
END $$;

-- Add lng column if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'sales' 
        AND column_name = 'lng'
    ) THEN
        ALTER TABLE sales ADD COLUMN lng DECIMAL(11, 8);
        RAISE NOTICE 'Added lng column to sales table';
    ELSE
        RAISE NOTICE 'lng column already exists';
    END IF;
END $$;

-- Show final column structure
SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'sales'
ORDER BY ordinal_position;
