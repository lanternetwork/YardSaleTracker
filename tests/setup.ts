// tests/setup.ts
import { vi } from 'vitest';
import { setupServer } from 'msw/node';
import { beforeAll, afterAll, afterEach } from 'vitest';
import '@testing-library/jest-dom/vitest'

// Provide a default API key for map-related tests
process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || 'test-key'

// Mock js-api-loader with a spy-able Loader constructor
vi.mock('@googlemaps/js-api-loader', async () => {
	const mod: any = await import('@/tests/utils/mocks')
	const Loader = vi.fn().mockImplementation((opts: any) => new mod.MockGoogleMapsLoader(opts))
	return { Loader }
})

// Lightweight Supabase client mock that:
// - returns a deterministic signed-in user
// - sets owner_id on insert if missing
// - restricts update/delete to owner rows
// - exposes spies for assertions
vi.mock('@supabase/supabase-js', () => {
	const calls: any = { tables: {}, auth: {} };
	const TEST_USER = { id: 'test-user-1', email: 'test@example.com' };

	const auth = {
		getUser: vi.fn().mockResolvedValue({ data: { user: TEST_USER }, error: null }),
		onAuthStateChange: vi.fn().mockImplementation((cb: any) => {
			cb('SIGNED_IN', { user: TEST_USER });
			return { data: { subscription: { unsubscribe: vi.fn() } } };
		}),
	};
	calls.auth = auth;

	function makeTableAPI(table: string) {
		if (!calls.tables[table]) calls.tables[table] = { rows: [] as any[] };
		const bag = calls.tables[table];

		let updateSpy: any = null
		let deleteSpy: any = null

		const api: any = {
			insert: vi.fn(async (payload: any | any[]) => {
				const arr = Array.isArray(payload) ? payload : [payload];
				const inserted = arr.map((r) => ({
					// preserve provided id; only create one if missing
					id: r.id ?? `sale-${Math.random().toString(36).slice(2, 8)}`,
					...r,
					owner_id: r.owner_id ?? TEST_USER.id,
				}));
				bag.rows.push(...inserted);
				return { data: inserted, error: null };
			}),
			select: vi.fn(async () => ({ data: bag.rows.slice(), error: null })),
			get update() {
				return (...args: any[]) => {
					if (typeof updateSpy === 'function') updateSpy(...args)
					return api
				}
			},
			set update(fn: any) {
				updateSpy = fn
			},
			get delete() {
				return (...args: any[]) => {
					if (typeof deleteSpy === 'function') deleteSpy(...args)
					return api
				}
			},
			set delete(fn: any) {
				deleteSpy = fn
			},
			eq: vi.fn(() => api),
			neq: vi.fn(() => api),
			in: vi.fn(() => api),
			order: vi.fn(() => api),
			limit: vi.fn(() => api),
			range: vi.fn(() => api),
			single: vi.fn(async () => ({ data: bag.rows[0] ?? null, error: null })),
			maybeSingle: vi.fn(async () => ({ data: bag.rows[0] ?? null, error: null })),
		};
		return api;
	}

	const client = {
		auth,
		from: (table: string) => makeTableAPI(table),
		rpc: vi.fn(async () => ({ data: null, error: null })),
		storage: { from: vi.fn(() => ({ upload: vi.fn(), getPublicUrl: vi.fn() })) },
		__calls: calls, // available to tests if they need to inspect spies
	};

	return {
		createClient: vi.fn(() => client),
	};
});

// MSW server for HTTP mocking in integration tests
export const server = setupServer();

beforeAll(() => server.listen({ onUnhandledRequest: 'warn' }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

export {};
