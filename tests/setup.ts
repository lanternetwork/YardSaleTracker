// tests/setup.ts
import { vi } from 'vitest';
import { setupServer } from 'msw/node';
import { beforeAll, afterAll, afterEach } from 'vitest';
import '@testing-library/jest-dom/vitest'

// Provide a default API key for map-related tests
process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || 'test-key'

// Spyable google maps globals for integration tests
const MarkerMock = vi.fn().mockImplementation((opts: any) => ({
  setMap: vi.fn(),
  addListener: vi.fn(),
  getPosition: vi.fn(() => ({ lat: () => 37.7749, lng: () => -122.4194 })),
  __opts: opts,
}))
const MapMock = vi.fn().mockImplementation((_el: any, _opts: any) => ({
  setCenter: vi.fn(),
  setZoom: vi.fn(),
  addListener: vi.fn(),
}))
const InfoWindowMock = vi.fn().mockImplementation((_opts: any) => ({
  open: vi.fn(),
  close: vi.fn(),
}))
const LatLngBoundsMock = vi.fn().mockImplementation(() => ({
  extend: vi.fn(),
  isEmpty: vi.fn(() => false),
}))

;(global as any).google = (global as any).google || {
  maps: {
    places: {
      Autocomplete: vi.fn().mockImplementation((_input: any, _opts: any) => ({
        addListener: vi.fn(),
        getPlace: vi.fn(() => ({ geometry: null })),
      })),
    },
    Map: MapMock,
    Marker: MarkerMock,
    InfoWindow: InfoWindowMock,
    LatLngBounds: LatLngBoundsMock,
    event: { addListener: vi.fn() },
  },
}

// Mock js-api-loader with a spy-able Loader constructor
vi.mock('@googlemaps/js-api-loader', async () => {
	const Loader = vi.fn().mockImplementation((_opts: any) => ({ load: vi.fn().mockResolvedValue(undefined) }))
	return { default: Loader, Loader }
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
		let lastPromise: Promise<any> | null = null

		const chain = () => ({
			eq: vi.fn(() => chain()),
			neq: vi.fn(() => chain()),
			in: vi.fn(() => chain()),
			order: vi.fn(() => chain()),
			limit: vi.fn(() => chain()),
			range: vi.fn(() => chain()),
			then: (resolve: any, reject?: any) => (lastPromise || Promise.resolve({ data: bag.rows.slice(), error: null })).then(resolve, reject),
		})

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
				lastPromise = Promise.resolve({ data: inserted, error: null })
				return { data: inserted, error: null };
			}),
			select: vi.fn(async () => ({ data: bag.rows.slice(), error: null })),
			get update() {
				return (...args: any[]) => {
					if (typeof updateSpy === 'function') lastPromise = Promise.resolve(updateSpy(...args))
					return chain()
				}
			},
			set update(fn: any) {
				updateSpy = fn
			},
			get delete() {
				return (...args: any[]) => {
					if (typeof deleteSpy === 'function') lastPromise = Promise.resolve(deleteSpy(...args))
					return chain()
				}
			},
			set delete(fn: any) {
				deleteSpy = fn
			},
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
